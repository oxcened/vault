import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3449",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3449",
    url: "http://127.0.0.1:3449",
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      TEST_NEXT_DIST_DIR: ".next-e2e",
      AUTH_SECRET: "integration-test-secret-not-for-production",
      AUTH_DISCORD_ID: "test",
      AUTH_DISCORD_SECRET: "test",
      ENABLE_USER_WHITELIST: "false",
    },
  },
});
