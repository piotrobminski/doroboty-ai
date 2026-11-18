// Verification host: ordinary files only, with no database or API middleware.
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
const roots = {
  app: resolve("artifacts/s3-upload"),
  reference: resolve("docs/design-system/technologia-po-ludzku"),
};
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
};
createServer((req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, "http://static").pathname);
    const reference = name.startsWith("/reference/");
    const root = reference ? roots.reference : roots.app;
    const relative = reference ? name.slice("/reference".length) : name;
    const path = resolve(root, `.${relative.endsWith("/") ? relative + "index.html" : relative}`);
    if (!path.startsWith(root + sep) || !statSync(path).isFile()) throw new Error("Not found");
    res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" });
    createReadStream(path).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(Number(process.env.STATIC_DEMO_PORT || 3190), "127.0.0.1");
