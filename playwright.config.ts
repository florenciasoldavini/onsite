import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: "test-results/playwright",
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"]
      }
    }
  ],
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  retries: process.env.CI ? 1 : 0,
  testDir: "./e2e/web",
  timeout: 30_000,
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: "node scripts/serve-e2e-web.js",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: `${baseURL}/sign-in`
  }
});
