import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";
const isCI = process.env["CI"] !== undefined;

export default defineConfig({
  testDir: "./e2e",
  outputDir: ".tmp/qa/playwright-results",
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
    {
      name: "webkit",
      use: devices["Desktop Safari"],
    },
  ],
  webServer: {
    command: "bun run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: baseURL,
    reuseExistingServer: !isCI,
  },
});
