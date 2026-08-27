import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";

import * as schema from "./schema";

type Database = NeonDatabase<typeof schema>;

let dbInstance: Database | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and configure your Neon Frankfurt connection string."
    );
  }
  return url;
}

export function getDb(): Database {
  if (!dbInstance) {
    const pool = new Pool({ connectionString: getDatabaseUrl() });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

export async function checkDatabaseConnection(): Promise<void> {
  const db = getDb();
  await db.execute(sql`SELECT 1`);
}
