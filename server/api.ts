import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { databaseFileGuard } from "./database-files";
import {
  accountCommandSchema,
  changePasswordSchema,
  loginSchema,
  passwordResetSchema,
  requestRecoverySchema,
} from "../src/features/auth/contract";
import type { PasswordRecovery } from "./password-recovery";
import { actionSchema } from "../src/features/prototype/model";
import { parseState } from "../src/features/prototype/storage";
import { PrototypeDatabase, SESSION_SECONDS, OperationFailure } from "./database";

const COOKIE = "doroboty_session";
function token(req: IncomingMessage) {
  return req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
}
function reply(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(value));
}
class RequestFailure extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
async function body(req: IncomingMessage) {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    throw new RequestFailure(415, "Wymagany format JSON.");
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += Buffer.byteLength(chunk);
    if (size > 2_000_000) throw new RequestFailure(413, "Plik jest za duży (maksymalnie 2 MB).");
    chunks.push(Buffer.from(chunk));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestFailure(400, "Nieprawidłowe dane JSON.");
  }
}
function parseImport(input: unknown) {
  try {
    return parseState(JSON.stringify(input));
  } catch (error) {
    throw new RequestFailure(422, (error as Error).message);
  }
}
export function createApi(
  database: PrototypeDatabase,
  secureCookie = false,
  recovery?: PasswordRecovery,
) {
  let logins = 0;
  let deliveries = 0;
  const cookie = (value: string, age: number) =>
    `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secureCookie ? "; Secure" : ""}`;
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = req.url?.split("?")[0];
    if (!path?.startsWith("/api/") || path === "/api/recruiter-ai") {
      next();
      return;
    }
    try {
      const address = req.socket.remoteAddress ?? "";
      const recoveryAvailable =
        recovery &&
        (recovery.mode === "email" ||
          (["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address) &&
            /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(req.headers.host ?? "")));
      const personId = database.session(token(req));
      const access = database.access(personId);
      if (req.method === "GET" && path === "/api/state") {
        reply(res, 200, {
          ...database.sessionView(personId),
          recoveryMode: recoveryAvailable ? recovery.mode : "off",
        });
        return;
      }
      if (
        req.method === "GET" &&
        (path === "/api/admin/accounts" || path === "/api/scenario/export")
      ) {
        if (!personId || !access.admin || access.mustChangePassword)
          throw new RequestFailure(403, "Wymagane aktywne konto administratora.");
        reply(
          res,
          200,
          path === "/api/admin/accounts"
            ? database.accounts(personId)
            : database.scenario(personId),
        );
        return;
      }
      if (req.method !== "POST") throw new RequestFailure(405, "Niedozwolona metoda.");
      const origin = req.headers.origin;
      if (
        req.headers["x-requested-with"] !== "DoRoboty" ||
        req.headers["sec-fetch-site"] === "cross-site" ||
        (origin && origin !== `${secureCookie ? "https" : "http"}://${req.headers.host}`)
      )
        throw new RequestFailure(403, "Odśwież stronę i spróbuj ponownie z tej samej witryny.");
      const input = await body(req);
      if (path === "/api/auth/forgot-password" || path === "/api/auth/reset-password") {
        if (!recoveryAvailable)
          throw new RequestFailure(503, "Odzyskiwanie hasła jest niedostępne na tym serwerze.");
        if (path === "/api/auth/forgot-password") {
          const parsed = requestRecoverySchema.safeParse(input);
          if (!parsed.success) throw new RequestFailure(400, "Podaj poprawny adres e-mail.");
          const request =
            deliveries < 4 ? database.issuePasswordReset(parsed.data.email, address) : null;
          reply(res, 202, { ok: true });
          if (request) {
            deliveries++;
            const link = new URL(`/#/auth/reset-password?token=${request.token}`, recovery.origin);
            void recovery
              .deliver(request.email, link.href)
              .catch(() => {
                console.error("Password recovery delivery failed.");
              })
              .finally(() => {
                deliveries--;
              });
          }
        } else {
          const parsed = passwordResetSchema.safeParse(input);
          if (!parsed.success)
            throw new RequestFailure(400, "Sprawdź link i wymagania dotyczące hasła.");
          database.resetPassword(parsed.data.token, parsed.data.newPassword);
          database.logout(token(req));
          res.setHeader("Set-Cookie", cookie("", 0));
          reply(res, 200, { ok: true });
        }
        return;
      }
      if (path === "/api/auth/login") {
        const parsed = loginSchema.safeParse(input);
        if (!parsed.success) throw new RequestFailure(400, "Sprawdź adres e-mail i hasło.");
        if (logins >= 4)
          throw new RequestFailure(429, "Za dużo prób logowania. Spróbuj za chwilę.");
        logins++;
        let result;
        try {
          result = await database.login(
            parsed.data.email,
            parsed.data.password,
            req.socket.remoteAddress ?? "local",
          );
        } finally {
          logins--;
        }
        if (result && "limited" in result)
          throw new RequestFailure(429, "Za dużo prób logowania. Spróbuj za 15 minut.");
        if (!result) throw new RequestFailure(401, "Nieprawidłowy e-mail lub hasło.");
        database.logout(token(req));
        res.setHeader("Set-Cookie", cookie(result.token, SESSION_SECONDS));
        reply(res, 200, database.sessionView(result.personId));
        return;
      }
      if (path === "/api/auth/logout") {
        database.logout(token(req));
        res.setHeader("Set-Cookie", cookie("", 0));
        reply(res, 200, database.sessionView(null));
        return;
      }
      if (!personId)
        throw new RequestFailure(
          401,
          "Sesja wygasła. Zaloguj się ponownie; treść formularza pozostaje na stronie.",
        );
      if (database.session(token(req)) !== personId)
        throw new RequestFailure(401, "Sesja wygasła. Zaloguj się ponownie.");
      if (path === "/api/auth/change-password") {
        const parsed = changePasswordSchema.safeParse(input);
        if (!parsed.success) throw new RequestFailure(400, "Sprawdź wymagania dotyczące hasła.");
        if (logins >= 4) throw new RequestFailure(429, "Spróbuj ponownie za chwilę.");
        logins++;
        try {
          const renewed = await database.changePassword(
            personId,
            token(req)!,
            parsed.data.currentPassword,
            parsed.data.newPassword,
          );
          res.setHeader("Set-Cookie", cookie(renewed, SESSION_SECONDS));
          reply(res, 200, database.sessionView(personId));
        } finally {
          logins--;
        }
        return;
      }
      const currentAccess = database.access(personId);
      if (currentAccess.mustChangePassword)
        throw new RequestFailure(403, "Zmień tymczasowe hasło w ustawieniach.");
      if (path === "/api/admin/accounts") {
        if (!currentAccess.admin)
          throw new RequestFailure(403, "Wymagane aktywne konto administratora.");
        const parsed = accountCommandSchema.safeParse(input);
        if (!parsed.success)
          throw new RequestFailure(400, "Sprawdź dane konta i wymagania dotyczące hasła.");
        reply(res, 200, database.manageAccount(personId, parsed.data));
        return;
      }
      const person = database.read().people.find((p) => p.id === personId)!;
      if (path === "/api/actions") {
        const parsed = actionSchema.safeParse(input);
        if (!parsed.success)
          throw new RequestFailure(400, "Sprawdź poprawność i długość wprowadzonych danych.");
        const candidateActions = ["profile", "toggle_saved", "draft", "submit", "withdraw"];
        if (
          (candidateActions.includes(parsed.data.type) ? "candidate" : "employer") !== person.role
        )
          throw new RequestFailure(403, "To działanie nie jest dostępne dla Twojej roli.");
        database.act(personId, parsed.data);
        reply(res, 200, database.sessionView(personId));
        return;
      }
      if (!currentAccess.admin) throw new RequestFailure(403, "Wymagane konto administratora.");
      if (path === "/api/scenario/import") {
        database.replace(personId, parseImport(input));
        reply(res, 200, database.sessionView(personId));
        return;
      }
      if (path === "/api/scenario/reset") {
        database.reset(personId);
        reply(res, 200, database.sessionView(personId));
        return;
      }
      throw new RequestFailure(404, "Nie znaleziono operacji.");
    } catch (error) {
      if (res.destroyed) return;
      if (error instanceof RequestFailure) reply(res, error.status, { error: error.message });
      else if (error instanceof OperationFailure) reply(res, 422, { error: error.message });
      else
        reply(res, 503, {
          error:
            "Nie udało się zapisać danych. Spróbuj ponownie; treść formularza pozostaje na stronie.",
        });
    }
  };
}
export function databasePlugin(
  config: {
    path?: string;
    secureCookie?: boolean;
    adminPassword?: string;
    recovery?: PasswordRecovery;
  } = {},
): Plugin {
  const install = (server: {
    middlewares: {
      use: (handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
    };
    httpServer?: { once: (event: string, callback: () => void) => unknown } | null;
  }) => {
    const path = resolve(config.path || ".data/doroboty.sqlite");
    const database = new PrototypeDatabase(path, config.adminPassword);
    server.middlewares.use(databaseFileGuard(path));
    server.middlewares.use(createApi(database, config.secureCookie, config.recovery));
    server.httpServer?.once("close", () => database.close());
  };
  return { name: "prototype-database", configureServer: install, configurePreviewServer: install };
}
