import { defineConfig, devices } from "@playwright/test";

import {
  resolveDatabaseUrlOrThrow,
  resolveUnpooledDatabaseUrl,
} from "./e2e/test-env";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
const databaseUrl = resolveDatabaseUrlOrThrow();
const unpooledDatabaseUrl = resolveUnpooledDatabaseUrl(databaseUrl);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  globalSetup: "./e2e/global-setup.ts",
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-auth-secret",
      AUTH_URL: process.env.AUTH_URL ?? baseURL,
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "true",
      DATABASE_URL: databaseUrl,
      DATABASE_URL_UNPOOLED: unpooledDatabaseUrl,
      RECAPTCHA_SECRET_KEY: "",
      RECAPTCHA_SITE_KEY: "",
    },
  },
});
