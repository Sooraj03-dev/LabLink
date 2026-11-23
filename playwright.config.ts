import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.e2e.ts",
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:3197",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3197",
    url: "http://127.0.0.1:3197",
    timeout: 60000,
    env: { LABLINK_APP_ORIGIN: "", AI_ENABLED: "true", GENAI_PROVIDER: "mock" },
  },
});
