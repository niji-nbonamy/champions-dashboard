import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED?.trim() ??
  process.env.DATABASE_URL?.trim();

if (!migrationUrl) {
  throw new Error(
    "DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set. Copy .env.example to .env.local before running drizzle-kit."
  );
}

if (migrationUrl.includes("-pooler")) {
  throw new Error(
    "drizzle-kit requires Neon's direct (unpooled) connection string. In the Neon dashboard, use the connection string without -pooler in the hostname, or set DATABASE_URL_UNPOOLED."
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
