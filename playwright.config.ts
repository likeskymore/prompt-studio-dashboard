import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/integrationTest",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3005",
    browserName: "chromium",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3005",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
