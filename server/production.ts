import { createServer, type ServerResponse } from "node:http";
import { createReadStream, existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream";
import { createApi } from "./api";
import type { PasswordRecovery } from "./password-recovery";
import { PrototypeDatabase } from "./database";

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};
const privatePath = (path: string) =>
  path.split("/").some((part) => part.startsWith(".")) ||
  /\.(?:sqlite3?|db)(?:[.-].*)?$/i.test(path);
function end(res: ServerResponse, status: number) {
  res.writeHead(status, { "Cache-Control": "no-store" });
  res.end();
}
function canonicalPath(path: string) {
  let ancestor = resolve(path);
  const missing: string[] = [];
  while (!existsSync(ancestor)) {
    missing.unshift(basename(ancestor));
    ancestor = dirname(ancestor);
  }
  return join(realpathSync(ancestor), ...missing);
}

/** Serves only the release's public file inventory, never the working directory. */
export function createProductionServer(config: {
  publicDirectory: string;
  databasePath: string;
  secureCookie?: boolean;
  recovery?: PasswordRecovery;
}) {
  const root = realpathSync(config.publicDirectory);
  const databasePath = canonicalPath(config.databasePath);
  const databaseRelative = relative(root, databasePath);
  if (
    databaseRelative !== ".." &&
    !databaseRelative.startsWith(`..${sep}`) &&
    !isAbsolute(databaseRelative)
  )
    throw new Error("DATABASE_PATH must be outside the public asset directory.");
  const files = new Map<string, { path: string; size: number }>();
  function inventory(directory: string, prefix = "") {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const name = `${prefix}/${entry.name}`;
      if (entry.isSymbolicLink() || privatePath(name))
        throw new Error("Public assets must not include private files or symbolic links.");
      if (entry.isDirectory()) inventory(path, name);
      else if (entry.isFile()) files.set(name, { path, size: statSync(path).size });
      else throw new Error("Unsupported public asset type.");
    }
  }
  inventory(root);
  if (!files.has("/index.html")) throw new Error("Production index.html is missing.");
  files.set("/", files.get("/index.html")!);
  const database = new PrototypeDatabase(databasePath);
  const api = createApi(database, config.secureCookie, config.recovery);
  const server = createServer((req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    let path: string;
    try {
      path = decodeURIComponent((req.url ?? "/").split("?")[0]);
      if (!path.startsWith("/") || /[\\\0]/.test(path)) throw new Error("Invalid path");
    } catch {
      end(res, 400);
      return;
    }
    if (privatePath(path)) {
      end(res, 403);
      return;
    }
    if (path === "/api/recruiter-ai") {
      end(res, 404);
      return;
    }
    void api(req, res, () => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.setHeader("Allow", "GET, HEAD");
        end(res, 405);
        return;
      }
      const file = files.get(path);
      if (!file) {
        end(res, 404);
        return;
      }
      res.writeHead(200, {
        "Content-Type": contentTypes[extname(file.path)] ?? "application/octet-stream",
        "Content-Length": file.size,
        "Cache-Control":
          path.startsWith("/assets/") && /-[\w-]{8,}\./.test(path)
            ? "public, max-age=31536000, immutable"
            : "no-cache",
      });
      if (req.method === "HEAD") res.end();
      else pipeline(createReadStream(file.path), res, () => {});
    });
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.once("close", () => database.close());
  return server;
}
