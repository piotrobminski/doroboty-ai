import {
  FIXTURE_TEMPORARY_PASSWORD,
  FIXTURE_ADMIN_PASSWORD,
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_ADMIN_ID,
} from "../tests/admin-fixture";
import { removeLegacyOperatorRoles } from "./admin-bootstrap";
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
import type { PasswordRecovery } from "./password-recovery";

async function api(
  check: (url: string, db: PrototypeDatabase) => Promise<void>,
  secure = false,
  recovery?: PasswordRecovery,
) {
  const db = new PrototypeDatabase(":memory:", FIXTURE_TEMPORARY_PASSWORD);
  const handler = createApi(db, secure, recovery);
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

async function activateAdmin(db: PrototypeDatabase) {
  const login = await db.login(PRIMARY_ADMIN_EMAIL, FIXTURE_TEMPORARY_PASSWORD, "test-setup");
  if (!login || !("token" in login)) throw new Error("Unable to provision test administrator.");
  await db.changePassword(
    PRIMARY_ADMIN_ID,
    login.token,
    FIXTURE_TEMPORARY_PASSWORD,
    FIXTURE_ADMIN_PASSWORD,
  );
}
async function adminCookie(url: string) {
  const login = await post(url, "/api/auth/login", {
    email: PRIMARY_ADMIN_EMAIL,
    password: FIXTURE_TEMPORARY_PASSWORD,
  });
  const response = await post(
    url,
    "/api/auth/change-password",
    { currentPassword: FIXTURE_TEMPORARY_PASSWORD, newPassword: FIXTURE_ADMIN_PASSWORD },
    login.headers.get("set-cookie")!.split(";")[0],
  );
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
      removeLegacyOperatorRoles(initial);
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
  it("projects private records and rolls back invalid mutations/imports", async () => {
    const db = new PrototypeDatabase(":memory:", FIXTURE_TEMPORARY_PASSWORD);
    try {
      await activateAdmin(db);
      const before = db.read();
      expect(() =>
        db.act("candidate-anna", { type: "withdraw", applicationId: "application-example" }),
      ).toThrow();
      expect(db.read()).toEqual(before);
      expect(() =>
        db.replace(PRIMARY_ADMIN_ID, { ...before, people: before.people.slice(1) }),
      ).toThrow();
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
      db.reset(PRIMARY_ADMIN_ID);
      expect(db.read()).toEqual(before);
    } finally {
      db.close();
    }
  });
});

describe("authenticated API", () => {
  it("delivers one-time reset links privately and revokes sessions on successful reset", async () => {
    const deliveries: { email: string; link: string }[] = [];
    await api(
      async (url, db) => {
        const email = accountEmail("candidate-anna");
        const existing = await login(url, "candidate-anna");
        const request = (email: string, headers = {}) =>
          post(url, "/api/auth/forgot-password", { email }, "", headers);
        expect((await request(email, { Origin: "https://foreign.test" })).status).toBe(403);
        const unknown = await request("unknown@example.test");
        const known = await request(email);
        expect(known.status).toBe(202);
        expect(unknown.status).toBe(202);
        expect(await known.json()).toEqual(await unknown.json());
        expect(deliveries).toHaveLength(1);
        expect(deliveries[0].email).toBe(email);
        const link = new URL(deliveries[0].link);
        expect(link.origin).toBe("http://localhost:3001");
        const token = new URLSearchParams(link.hash.split("?")[1]).get("token")!;
        expect(db.sql.prepare("SELECT token_hash FROM password_resets").get()!.token_hash).not.toBe(
          token,
        );
        await request(email);
        await request(email);
        await request(email);
        expect(deliveries).toHaveLength(3);
        const reset = (token: string) =>
          post(url, "/api/auth/reset-password", { token, newPassword: "New-Recovery-Password" });
        expect((await reset(token)).status).toBe(200);
        expect((await reset(token)).status).toBe(422);
        const other = new URLSearchParams(new URL(deliveries[1].link).hash.split("?")[1]).get(
          "token",
        )!;
        expect((await reset(other)).status).toBe(422);
        expect(
          (await (await fetch(url + "/api/state", { headers: { Cookie: existing } })).json())
            .activePersonId,
        ).toBeNull();
        expect((await post(url, "/api/auth/login", { email, password: "Test1234" })).status).toBe(
          401,
        );
        expect(
          (await post(url, "/api/auth/login", { email, password: "New-Recovery-Password" })).status,
        ).toBe(200);
      },
      false,
      {
        mode: "local",
        origin: "http://localhost:3001",
        async deliver(email, link) {
          deliveries.push({ email, link });
        },
      },
    );
  }, 15000);
  it("restricts temporary sessions, protects the primary account and revokes sessions after credential and permission changes", async () => {
    await api(async (url) => {
      const path = "/api/admin/accounts";
      const oldOperator = await login(url, "operator");
      const list = (cookie: string) => fetch(url + path, { headers: { Cookie: cookie } });
      expect((await list(oldOperator)).status).toBe(403);
      expect((await post(url, "/api/scenario/reset", {}, oldOperator)).status).toBe(403);
      const temporary = await post(url, "/api/auth/login", {
        email: PRIMARY_ADMIN_EMAIL,
        password: FIXTURE_TEMPORARY_PASSWORD,
      });
      expect(await temporary.json()).toMatchObject({
        account: { admin: true, mustChangePassword: true },
        applications: [],
      });
      const locked = temporary.headers.get("set-cookie")!.split(";")[0];
      expect((await list(locked)).status).toBe(403);
      expect((await post(url, "/api/scenario/reset", {}, locked)).status).toBe(403);
      const admin = await adminCookie(url);
      expect((await list(locked)).status).toBe(403);
      const accounts = await (await list(admin)).json();
      expect(accounts.filter((account: { admin: boolean }) => account.admin)).toEqual([
        expect.objectContaining({
          id: PRIMARY_ADMIN_ID,
          email: PRIMARY_ADMIN_EMAIL,
          primary: true,
        }),
      ]);
      expect(JSON.stringify(accounts)).not.toContain("password");
      expect(
        (await post(url, path, { type: "set-admin", id: PRIMARY_ADMIN_ID, admin: false }, admin))
          .status,
      ).toBe(422);
      const input = {
        type: "create",
        role: "candidate",
        name: "Przykładowe konto",
        email: "new-account@example.test",
        password: "New-Temporary-24",
      };
      expect((await post(url, path, input, oldOperator)).status).toBe(403);
      const created = await post(url, path, input, admin);
      expect(created.status).toBe(200);
      expect(
        (await post(url, path, { ...input, email: input.email.toUpperCase() }, admin)).status,
      ).toBe(422);
      const { id } = (await created.json()).find(
        (item: { email: string }) => item.email === input.email,
      );
      const loginNew = (password: string) =>
        post(url, "/api/auth/login", { email: input.email, password });
      const newLogin = await loginNew(input.password);
      const newCookie = newLogin.headers.get("set-cookie")!.split(";")[0];
      const change = (currentPassword: string, cookie: string) =>
        post(
          url,
          "/api/auth/change-password",
          { currentPassword, newPassword: "New-Private-24" },
          cookie,
        );
      expect((await change("wrong", newCookie)).status).toBe(422);
      const rotated = await change(input.password, newCookie);
      expect(rotated.status).toBe(200);
      expect((await loginNew(input.password)).status).toBe(401);
      const active = rotated.headers.get("set-cookie")!.split(";")[0];
      expect((await post(url, path, { type: "set-admin", id, admin: true }, admin)).status).toBe(
        200,
      );
      expect((await list(active)).status).toBe(403);
      const permitted = (await loginNew("New-Private-24")).headers.get("set-cookie")!.split(";")[0];
      expect((await list(permitted)).status).toBe(200);
      expect(
        (
          await post(
            url,
            path,
            { type: "reset-password", id: PRIMARY_ADMIN_ID, password: "New-Temporary-24" },
            permitted,
          )
        ).status,
      ).toBe(422);
      expect((await post(url, path, { type: "set-admin", id, admin: false }, admin)).status).toBe(
        200,
      );
      expect((await list(permitted)).status).toBe(403);
      expect(
        (
          await post(
            url,
            path,
            { type: "reset-password", id, password: "Reset-Temporary-24" },
            admin,
          )
        ).status,
      ).toBe(200);
      expect((await loginNew("New-Private-24")).status).toBe(401);
      expect(await (await loginNew("Reset-Temporary-24")).json()).toMatchObject({
        account: { admin: false, mustChangePassword: true },
      });
    });
  }, 20000);
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
      const operator = await adminCookie(url);
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
