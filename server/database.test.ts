import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { PrototypeDatabase, SESSION_SECONDS } from "./database";
import { databaseFileGuard } from "./database-files";
import { createApi } from "./api";
import { initialState, type State } from "../src/features/prototype/model";
import { API_HEADER, accountEmail } from "../src/features/auth/contract";

async function api(check: (url: string, db: PrototypeDatabase) => Promise<void>, secure = false) {
  const db = new PrototypeDatabase(":memory:");
  const handler = createApi(db, secure);
  const guard = databaseFileGuard(resolve("private-session-store"));
  const server = createServer((req, res) => {
    guard(req, res, () => {
      void handler(req, res, () => {
        res.writeHead(404);
        res.end();
      });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await check(`http://127.0.0.1:${(server.address() as AddressInfo).port}`, db);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  }
}
async function post(url: string, path: string, data: unknown, cookie = "", headers = {}) {
  return fetch(url + path, {
    method: "POST",
    headers: { ...API_HEADER, Cookie: cookie, ...headers },
    body: JSON.stringify(data),
  });
}
async function login(url: string, id: string) {
  const response = await post(url, "/api/auth/login", {
    email: accountEmail(id),
    password: "Test1234",
  });
  expect(response.status).toBe(200);
  return response.headers.get("set-cookie")!.split(";")[0];
}

describe("SQLite accounts and scenario", () => {
  it("preserves every account/profile, uses distinct hashes, and survives restart without reseeding", async () => {
    const folder = mkdtempSync(join(tmpdir(), "doroboty-db-"));
    const path = join(folder, "test.sqlite");
    let db = new PrototypeDatabase(path);
    try {
      const initial = initialState();
      expect(db.read()).toEqual(initial);
      const hashes = db.sql
        .prepare("SELECT password_hash FROM users")
        .all()
        .map((r) => r.password_hash);
      expect(new Set(hashes).size).toBe(initial.people.length);
      for (const person of initial.people) {
        const result = await db.login(accountEmail(person.id).toUpperCase(), "Test1234", person.id);
        expect(result && "personId" in result && result.personId).toBe(person.id);
      }
      db.act("candidate-anna", {
        type: "profile",
        value: { ...initial.people[0], name: "Zachowana Anna" },
      });
      const loginResult = await db.login(accountEmail("candidate-anna"), "Test1234", "restart");
      if (!loginResult || !("token" in loginResult)) throw new Error("Login failed");
      const session = loginResult.token;
      db.close();
      db = new PrototypeDatabase(path);
      expect(db.read().people[0].name).toBe("Zachowana Anna");
      expect(
        db.sql
          .prepare("SELECT password_hash FROM users")
          .all()
          .map((r) => r.password_hash),
      ).toEqual(hashes);
      expect(db.session(session)).toBe("candidate-anna");
      expect(db.session(session, Date.now() + (SESSION_SECONDS + 1) * 1000)).toBe(null);
      db.logout(session);
      expect(db.session(session)).toBe(null);
      expect(JSON.stringify(db.view("operator"))).not.toContain("password_hash");
    } finally {
      db.close();
      rmSync(folder, { recursive: true });
    }
  }, 20000);
  it("projects private records and rolls back invalid mutations/imports", () => {
    const db = new PrototypeDatabase(":memory:");
    try {
      const before = db.read();
      expect(() =>
        db.act("candidate-anna", { type: "withdraw", applicationId: "application-example" }),
      ).toThrow();
      expect(db.read()).toEqual(before);
      expect(() => db.replace("operator", { ...before, people: before.people.slice(1) })).toThrow();
      expect(db.read()).toEqual(before);
      expect(db.view(null).applications).toEqual([]);
      expect(db.view(null).people.some((p) => p.role === "candidate")).toBe(false);
      expect(db.view("candidate-anna").applications).toEqual([]);
      expect(db.view("employer-northstar").applications).toEqual([]);
      db.act("employer-brightlabs", {
        type: "stage",
        applicationId: "application-example",
        stage: "reviewed",
        note: "Notatka prywatna",
      });
      expect(db.view("candidate-marek").applications[0].events[1].note).toBe("");
      expect(db.view("employer-brightlabs").applications[0].events[1].note).toBe(
        "Notatka prywatna",
      );
      db.reset("operator");
      expect(db.read()).toEqual(before);
    } finally {
      db.close();
    }
  });
});

describe("authenticated API", () => {
  it("enforces sessions, same origin, strict commands and operator-only import/reset", async () => {
    await api(async (url, db) => {
      for (const file of [
        "/.data/doroboty.sqlite",
        "/%2edata/e2e.sqlite-wal?raw",
        "/private-session-store",
        `/@fs${resolve("private-session-store")}`,
        "/data.sqlite?url",
      ]) {
        expect((await fetch(url + file)).status).toBe(403);
      }
      const profile = { type: "profile", value: initialState().people[0] };
      expect((await post(url, "/api/actions", profile)).status).toBe(401);
      const failed = await post(url, "/api/auth/login", {
        email: accountEmail("candidate-anna"),
        password: "wrong",
      });
      expect(failed.status).toBe(401);
      expect(failed.headers.get("set-cookie")).toBe(null);
      const candidate = await login(url, "candidate-anna");
      expect(
        (await post(url, "/api/actions", { type: "select_person", id: "operator" }, candidate))
          .status,
      ).toBe(400);
      expect((await post(url, "/api/scenario/reset", {}, candidate)).status).toBe(403);
      expect(
        (
          await post(
            url,
            "/api/actions",
            { type: "stage", applicationId: "application-example", stage: "reviewed", note: "" },
            candidate,
          )
        ).status,
      ).toBe(403);
      expect(
        (await post(url, "/api/actions", profile, candidate, { Origin: "https://foreign.test" }))
          .status,
      ).toBe(403);
      expect(
        (await post(url, "/api/actions", profile, candidate, { "X-Requested-With": "" })).status,
      ).toBe(403);
      const published = await post(
        url,
        "/api/actions",
        {
          type: "submit",
          jobId: db.read().jobs[0].id,
          notes: "",
          generated: "",
          answer: "Mam doświadczenie w rozwoju produktów.",
          consent: true,
        },
        candidate,
      );
      expect(published.status).toBe(200);
      const candidateState: State = await published.json();
      expect(candidateState.applications).toHaveLength(1);
      expect(candidateState.applications[0].candidateId).toBe("candidate-anna");
      const employer = await login(url, "employer-brightlabs");
      const response: State = await (
        await fetch(url + "/api/state", { headers: { Cookie: employer } })
      ).json();
      expect(response.applications).toHaveLength(2);
      expect(response.people.find((p) => p.id === "candidate-anna")?.cv).toBe("");
      await post(url, "/api/auth/logout", {}, candidate);
      expect((await post(url, "/api/actions", profile, candidate)).status).toBe(401);
      const operator = await login(url, "operator");
      expect((await post(url, "/api/scenario/import", { version: 99 }, operator)).status).toBe(422);
      expect((await post(url, "/api/scenario/reset", {}, operator)).status).toBe(200);
    });
  }, 15000);
  it("sets secure opaque cookies, limits failures and rejects malformed/oversized bodies", async () => {
    await api(async (url) => {
      const response = await post(url, "/api/auth/login", {
        email: accountEmail("operator"),
        password: "Test1234",
      });
      expect(response.headers.get("set-cookie")).toMatch(
        /HttpOnly; SameSite=Strict; Max-Age=43200; Secure/,
      );
      expect(response.headers.get("cache-control")).toBe("no-store");
      const bad = await fetch(url + "/api/auth/login", {
        method: "POST",
        headers: API_HEADER,
        body: "{",
      });
      expect(bad.status).toBe(400);
      expect((await post(url, "/api/auth/login", "x".repeat(2_000_000))).status).toBe(413);
      for (let i = 0; i < 10; i++)
        expect(
          (
            await post(url, "/api/auth/login", {
              email: "missing@doroboty.test",
              password: "wrong",
            })
          ).status,
        ).toBe(401);
      expect(
        (
          await post(url, "/api/auth/login", {
            email: accountEmail("operator"),
            password: "Test1234",
          })
        ).status,
      ).toBe(429);
    }, true);
  }, 15000);
});
