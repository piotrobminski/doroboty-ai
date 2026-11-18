import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, it, expect } from "vitest";
import { createProductionServer } from "./production";
import { API_HEADER, accountEmail } from "../src/features/auth/contract";
import { initialState } from "../src/features/prototype/model";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "doroboty-production-test-"));
  const publicDirectory = join(root, "public");
  mkdirSync(join(publicDirectory, "assets"), { recursive: true });
  writeFileSync(join(publicDirectory, "index.html"), "<!doctype html><title>Release</title>");
  writeFileSync(join(publicDirectory, "assets/app-12345678.js"), "console.log('release');");
  writeFileSync(join(publicDirectory, "example.pdf"), "%PDF-1.4\n");
  const databasePath = join(root, "private", "scenario.sqlite");
  return { root, publicDirectory, databasePath };
}
async function listen(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
async function rawStatus(url: string, path: string) {
  return new Promise<number>((resolve, reject) => {
    const req = request(url, { path }, (res) => {
      res.resume();
      res.once("end", () => resolve(res.statusCode!));
    });
    req.once("error", reject);
    req.end();
  });
}
const post = (url: string, path: string, data: unknown, headers = {}) =>
  fetch(url + path, {
    method: "POST",
    headers: { ...API_HEADER, ...headers },
    body: JSON.stringify(data),
  });

describe("standalone production HTTP server", () => {
  it("serves only build files, enforces API access and retains profile/session data after restart", async () => {
    const config = fixture();
    let server = createProductionServer(config);
    try {
      let url = await listen(server);
      expect(await (await fetch(url)).text()).toContain("<title>Release</title>");
      const asset = await fetch(`${url}/assets/app-12345678.js?v=1`, { method: "HEAD" });
      expect(asset.status).toBe(200);
      expect(asset.headers.get("content-type")).toBe("text/javascript; charset=utf-8");
      expect(asset.headers.get("cache-control")).toContain("immutable");
      expect(asset.headers.get("content-length")).toBe("23");
      expect(await asset.text()).toBe("");
      expect((await fetch(url + "/example.pdf")).headers.get("content-type")).toBe(
        "application/pdf",
      );
      for (const path of [
        "/server.mjs",
        "/src/main.tsx",
        "/manifest.json",
        "/missing",
        "/api/recruiter-ai",
      ])
        expect((await fetch(url + path)).status).toBe(404);
      for (const path of [
        "/.env",
        "/.data/scenario.sqlite",
        "/data.sqlite.v1-backup-1.sqlite",
        "/assets/%2e%2e/%2e%2e/server.mjs",
        "/%2eenv.local",
      ])
        expect(await rawStatus(url, path)).toBe(403);
      expect(await rawStatus(url, "/%ZZ")).toBe(400);
      expect((await fetch(url, { method: "POST" })).status).toBe(405);
      expect((await post(url, "/api/scenario/reset", {})).status).toBe(401);
      const login = await post(
        url,
        "/api/auth/login",
        {
          email: accountEmail("candidate-anna"),
          password: "Test1234",
        },
        { Origin: url },
      );
      expect(login.status).toBe(200);
      const cookie = login.headers.get("set-cookie")!.split(";")[0];
      expect(login.headers.get("set-cookie")).toContain("HttpOnly");
      expect((await post(url, "/api/scenario/reset", {}, { Cookie: cookie })).status).toBe(403);
      const value = { ...initialState().people[0], name: "Persistent release profile" };
      expect(
        (await post(url, "/api/actions", { type: "profile", value }, { Cookie: cookie })).status,
      ).toBe(200);
      expect(
        (
          await post(
            url,
            "/api/auth/logout",
            {},
            { Cookie: cookie, Origin: "https://foreign.test" },
          )
        ).status,
      ).toBe(403);
      await close(server);
      server = createProductionServer(config);
      url = await listen(server);
      const state = await (await fetch(url + "/api/state", { headers: { Cookie: cookie } })).json();
      expect(state.activePersonId).toBe("candidate-anna");
      expect(
        state.people.find((person: { id: string }) => person.id === "candidate-anna").name,
      ).toBe(value.name);
      expect((await (await fetch(url + "/api/state")).json()).activePersonId).toBe(null);
    } finally {
      if (server.listening) await close(server);
      rmSync(config.root, { recursive: true, force: true });
    }
  }, 20000);

  it("uses the HTTPS origin and secure cookies when configured behind a proxy", async () => {
    const config = fixture();
    const server = createProductionServer({ ...config, secureCookie: true });
    try {
      const url = await listen(server);
      const input = { email: accountEmail("candidate-anna"), password: "Test1234" };
      expect((await post(url, "/api/auth/login", input, { Origin: url })).status).toBe(403);
      const response = await post(url, "/api/auth/login", input, {
        Origin: url.replace("http:", "https:"),
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain("; Secure");
    } finally {
      if (server.listening) await close(server);
      rmSync(config.root, { recursive: true, force: true });
    }
  });

  it("rejects public databases and symlink/private-file assets before opening SQLite", () => {
    const config = fixture();
    try {
      expect(() =>
        createProductionServer({ ...config, databasePath: join(config.publicDirectory, "store") }),
      ).toThrow(/outside/);
      const privateFile = join(config.root, "private-key");
      writeFileSync(privateFile, "private");
      const link = join(config.publicDirectory, "leak.txt");
      symlinkSync(privateFile, link);
      expect(() => createProductionServer(config)).toThrow(/private files or symbolic links/);
      rmSync(link);
      writeFileSync(join(config.publicDirectory, ".env"), "SECRET=private");
      expect(() => createProductionServer(config)).toThrow(/private files or symbolic links/);
    } finally {
      rmSync(config.root, { recursive: true, force: true });
    }
  });
});
