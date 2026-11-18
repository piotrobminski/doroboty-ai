import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
const port = Number(process.env.STATIC_DEMO_PORT || 3190);
export default defineConfig({
  testDir: ".",
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: resolve("artifacts/s3-tests/report"), open: "never" }],
  ],
  outputDir: resolve("artifacts/s3-tests/results"),
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
  },
  webServer: {
    command: "node tests/static/serve.mjs",
    cwd: "../..",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
