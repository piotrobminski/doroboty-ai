import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createProductionServer } from "./production";
import { passwordRecoveryFromEnv } from "./password-recovery";
import { postHogFromEnv } from "./posthog";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = process.env.PORT ?? "3001";
if (Number(process.versions.node.split(".")[0]) !== 24)
  throw new Error("This release requires Node.js 24.");
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
  throw new Error("PORT must be an integer between 1 and 65535.");
if (process.env.AUTH_SECURE_COOKIE && !["0", "1"].includes(process.env.AUTH_SECURE_COOKIE))
  throw new Error("AUTH_SECURE_COOKIE must be 0 or 1.");
const host = process.env.HOST ?? "0.0.0.0";
if (!host.trim()) throw new Error("HOST must not be empty.");
const server = createProductionServer({
  publicDirectory: resolve(root, "public"),
  databasePath: resolve(root, process.env.DATABASE_PATH || ".data/doroboty.sqlite"),
  secureCookie: process.env.AUTH_SECURE_COOKIE === "1",
  recovery: passwordRecoveryFromEnv(process.env),
  capture: postHogFromEnv(process.env),
});
server.once("error", () => {
  console.error("Server could not start. Check HOST, PORT and directory permissions.");
  server.close();
  process.exitCode = 1;
});
server.listen(Number(port), host, () => {
  console.log(`DoRoboty.ai listening on http://${host}:${port}`);
});
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => server.closeAllConnections(), 10_000);
  deadline.unref();
  server.close(() => clearTimeout(deadline));
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
