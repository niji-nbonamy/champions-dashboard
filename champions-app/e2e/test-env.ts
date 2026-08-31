import { config as loadEnv } from "dotenv";
import path from "path";

const CI_DATABASE_URL = "postgresql://ci:ci@localhost:5432/champions_ci";

let envLoaded = false;

export function loadE2EEnv(): void {
  if (envLoaded) {
    return;
  }

  const root = path.resolve(__dirname, "..");
  loadEnv({ path: path.join(root, ".env.local") });
  loadEnv({ path: path.join(root, ".env") });
  envLoaded = true;
}

export function resolveDatabaseUrl(): string | null {
  loadE2EEnv();

  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (process.env.CI === "true") {
    return CI_DATABASE_URL;
  }

  return null;
}

export function resolveDatabaseUrlOrThrow(): string {
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for E2E tests. Configure champions-app/.env.local or export DATABASE_URL before running Playwright."
    );
  }

  return databaseUrl;
}

export function resolveUnpooledDatabaseUrl(databaseUrl: string): string {
  loadE2EEnv();
  return process.env.DATABASE_URL_UNPOOLED?.trim() || databaseUrl;
}
