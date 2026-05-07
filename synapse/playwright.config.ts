import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node server/index.js --vault ./test-vault --host 0.0.0.0",
    port: 5173,
    reuseExistingServer: true,
  },
});
