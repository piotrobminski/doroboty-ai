import { isAbsolute, relative, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

// Dev serves source files as well as assets. Never let SQLite/session files reach it.
export function databaseFileGuard(databasePath: string) {
  const privateUrls = [process.cwd(), resolve("public"), resolve("dist")]
    .map((base) => relative(base, databasePath))
    .filter((path) => !path.startsWith("..") && !isAbsolute(path))
    .map((path) => `/${path.replaceAll("\\", "/")}`);
  privateUrls.push(`/@fs${databasePath.replaceAll("\\", "/")}`);
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    let path: string;
    try {
      path = decodeURIComponent(new URL(req.url ?? "/", "http://local").pathname).replaceAll(
        "\\",
        "/",
      );
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (
      /(?:^|\/)\.data(?:\/|$)/i.test(path) ||
      /\.(?:sqlite3?|db)(?:-(?:wal|shm|journal))?$/i.test(path) ||
      privateUrls.some((privateUrl) =>
        ["", "-wal", "-shm", "-journal"].some(
          (suffix) => path.toLowerCase() === (privateUrl + suffix).toLowerCase(),
        ),
      )
    ) {
      res.writeHead(403, {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end("Forbidden");
      return;
    }
    next();
  };
}
