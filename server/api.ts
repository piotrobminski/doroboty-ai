import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { databaseFileGuard } from "./database-files";
import { loginSchema } from "../src/features/auth/contract";
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
export function createApi(database: PrototypeDatabase, secureCookie = false) {
  let logins = 0;
  const cookie = (value: string, age: number) =>
    `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secureCookie ? "; Secure" : ""}`;
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = req.url?.split("?")[0];
    if (!path?.startsWith("/api/") || path === "/api/recruiter-ai") {
      next();
      return;
    }
    try {
      const personId = database.session(token(req));
      if (req.method === "GET" && path === "/api/state") {
        reply(res, 200, database.view(personId));
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
        reply(res, 200, database.view(result.personId));
        return;
      }
      if (path === "/api/auth/logout") {
        database.logout(token(req));
        res.setHeader("Set-Cookie", cookie("", 0));
        reply(res, 200, database.view(null));
        return;
      }
      if (!personId)
        throw new RequestFailure(
          401,
          "Sesja wygasła. Zaloguj się ponownie; treść formularza pozostaje na stronie.",
        );
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
        reply(res, 200, database.act(personId, parsed.data));
        return;
      }
      if (person.role !== "operator") throw new RequestFailure(403, "Wymagane konto prowadzącego.");
      if (path === "/api/scenario/import") {
        reply(res, 200, database.replace(personId, parseImport(input)));
        return;
      }
      if (path === "/api/scenario/reset") {
        reply(res, 200, database.reset(personId));
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
export function databasePlugin(config: { path?: string; secureCookie?: boolean } = {}): Plugin {
  const install = (server: {
    middlewares: {
      use: (handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
    };
    httpServer?: { once: (event: string, callback: () => void) => unknown } | null;
  }) => {
    const path = resolve(config.path || ".data/doroboty.sqlite");
    const database = new PrototypeDatabase(path);
    server.middlewares.use(databaseFileGuard(path));
    server.middlewares.use(createApi(database, config.secureCookie));
    server.httpServer?.once("close", () => database.close());
  };
  return { name: "prototype-database", configureServer: install, configurePreviewServer: install };
}
