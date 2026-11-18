import { randomUUID } from "node:crypto";
import { mkdir, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { RecoveryMode } from "../src/features/auth/contract";
import { PASSWORD_RESET_TTL_MS } from "./database";

export type PasswordRecovery = {
  mode: Exclude<RecoveryMode, "off">;
  origin: string;
  deliver: (email: string, link: string) => Promise<void>;
};

export function passwordRecoveryFromEnv(
  env: Record<string, string | undefined>,
): PasswordRecovery | undefined {
  const mode = env.AUTH_RESET_DELIVERY;
  if (!mode) return;
  if (mode !== "local" && mode !== "email")
    throw new Error("AUTH_RESET_DELIVERY must be local or email.");
  const origin = new URL(
    env.AUTH_RESET_ORIGIN || (mode === "local" ? "http://localhost:3001" : ""),
  );
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash)
    throw new Error("AUTH_RESET_ORIGIN must specify the app origin.");
  if (mode === "local") {
    if (origin.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(origin.hostname))
      throw new Error("Local recovery requires an HTTP loopback origin.");
    const directory = resolve(".data/password-reset-mail", origin.port || "80");
    return {
      mode,
      origin: origin.origin,
      async deliver(email, link) {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const files = await readdir(directory, { withFileTypes: true });
        for (const file of files) {
          if (!file.isFile() || !/^reset-[\da-f-]+\.json$/.test(file.name)) continue;
          const path = join(directory, file.name);
          try {
            if ((await stat(path)).mtimeMs <= Date.now() - PASSWORD_RESET_TTL_MS)
              await unlink(path);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          }
        }
        const file = join(directory, `reset-${randomUUID()}.json`);
        const staging = `${file}.tmp`;
        try {
          await writeFile(staging, JSON.stringify({ email, link }, null, 2) + "\n", {
            mode: 0o600,
            flag: "wx",
          });
          await rename(staging, file);
        } catch (error) {
          await rm(staging, { force: true });
          throw error;
        }
      },
    };
  }
  const from = env.AUTH_RESET_EMAIL_FROM;
  const key = env.AUTH_RESET_RESEND_KEY;
  if (origin.protocol !== "https:" || !from || !key)
    throw new Error("Email recovery requires an HTTPS app origin, sender and Resend key.");
  return {
    mode,
    origin: origin.origin,
    async deliver(email, link) {
      if (email.toLowerCase().endsWith(".test")) return;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Ustaw nowe hasło w DoRoboty.ai",
          text: `Ustaw nowe hasło do DoRoboty.ai. Link jest jednorazowy i ważny przez 30 minut.\n\n${link}\n\nJeśli nie prosisz o reset hasła, zignoruj tę wiadomość.`,
        }),
        signal: AbortSignal.timeout(5_000),
        redirect: "error",
      });
      await response.body?.cancel();
      if (!response.ok) throw new Error("Password recovery delivery failed.");
    },
  };
}
