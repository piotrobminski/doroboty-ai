import { defineConfig, devices } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { FIXTURE_TEMPORARY_PASSWORD } from "./tests/admin-fixture";
const testPort = Number(process.env.PROTOTYPE_TEST_PORT || "3106");
if (!Number.isInteger(testPort) || testPort < 1024 || testPort > 65535)
  throw new Error("Invalid PROTOTYPE_TEST_PORT");
const testOrigin = `http://127.0.0.1:${testPort}`;
const productionDirectory = process.env.PLAYWRIGHT_PRODUCTION_DIR;
const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: testOrigin,
    trace: "retain-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: productionDirectory
      ? `${quote(process.execPath)} ${quote(resolve(productionDirectory, "server.mjs"))}`
      : `npm run preview -- --port ${testPort}`,
    env: {
      PROTOTYPE_AI_DISABLE: "1",
      POSTHOG_PROJECT_TOKEN: "",
      DATABASE_PATH: resolve(
        `.data/e2e-${productionDirectory ? "production-" : ""}${testPort}-${randomUUID()}.sqlite`,
      ),
      HOST: "127.0.0.1",
      PORT: String(testPort),
      AUTH_SECURE_COOKIE: "0",
      AUTH_ADMIN_PASSWORD: FIXTURE_TEMPORARY_PASSWORD,
      AUTH_RESET_DELIVERY: "local",
      AUTH_RESET_ORIGIN: testOrigin,
    },
    url: testOrigin,
    reuseExistingServer: false,
  },
});
