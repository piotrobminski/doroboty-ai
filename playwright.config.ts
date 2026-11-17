import { defineConfig, devices } from "@playwright/test";
const testPort = Number(process.env.PROTOTYPE_TEST_PORT || "3106");
if (!Number.isInteger(testPort) || testPort < 1024 || testPort > 65535)
  throw new Error("Invalid PROTOTYPE_TEST_PORT");
const testOrigin = `http://127.0.0.1:${testPort}`;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: testOrigin,
    trace: "retain-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run preview -- --port ${testPort}`,
    env: { PROTOTYPE_AI_DISABLE: "1" },
    url: testOrigin,
    reuseExistingServer: false,
  },
});
