import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { recruiterAiPlugin } from "./server/recruiter-ai";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "OPENAI_");
  return {
    plugins: [
      react(),
      tailwindcss(),
      recruiterAiPlugin({
        apiKey: process.env.PROTOTYPE_AI_DISABLE === "1" ? undefined : env.OPENAI_API_KEY?.trim(),
        model: env.OPENAI_MODEL?.trim() || "gpt-5-mini",
      }),
    ],
    base: "./",
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  };
});
