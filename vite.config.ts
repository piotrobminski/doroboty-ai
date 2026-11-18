import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { databasePlugin } from "./server/api";
import { recruiterAiPlugin } from "./server/recruiter-ai";
import { passwordRecoveryFromEnv } from "./server/password-recovery";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "OPENAI_");
  const serverEnv = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), [
    "DATABASE_",
    "AUTH_",
  ]);
  return {
    plugins: [
      databasePlugin({
        path: process.env.DATABASE_PATH || serverEnv.DATABASE_PATH,
        secureCookie: (process.env.AUTH_SECURE_COOKIE ?? serverEnv.AUTH_SECURE_COOKIE) === "1",
        adminPassword: process.env.AUTH_ADMIN_PASSWORD ?? serverEnv.AUTH_ADMIN_PASSWORD,
        recovery:
          mode === "static-demo"
            ? undefined
            : passwordRecoveryFromEnv({ ...serverEnv, ...process.env }),
      }),
      react(),
      tailwindcss(),
      recruiterAiPlugin({
        apiKey: process.env.PROTOTYPE_AI_DISABLE === "1" ? undefined : env.OPENAI_API_KEY?.trim(),
        model: env.OPENAI_MODEL?.trim() || "gpt-5-mini",
      }),
    ],
    base: "./",
    optimizeDeps: { entries: ["index.html"] },
    server: {
      fs: {
        deny: [
          ".env",
          ".env.*",
          "*.{crt,pem}",
          "**/.git/**",
          "**/.data/**",
          "**/*.sqlite*",
          "**/*.db",
        ],
      },
    },
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  };
});
