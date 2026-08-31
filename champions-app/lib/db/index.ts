import { Pool as NeonPool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import {
  drizzle as neonDrizzle,
  type NeonDatabase,
} from "drizzle-orm/neon-serverless";
import {
  drizzle as pgDrizzle,
  type NodePgDatabase,
} from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";

import { isLocalPostgresUrl } from "./is-local-postgres-url";
import * as schema from "./schema";

type Database = NeonDatabase<typeof schema> | NodePgDatabase<typeof schema>;

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

function createDatabase(connectionString: string): Database {
  if (isLocalPostgresUrl(connectionString)) {
    const pool = new PgPool({ connectionString, max: 10 });
    return pgDrizzle(pool, { schema });
  }

  const pool = new NeonPool({ connectionString });
  return neonDrizzle(pool, { schema });
}

export function getDb(): Database {
  if (!dbInstance) {
    dbInstance = createDatabase(getDatabaseUrl());
  }
  return dbInstance;
}

export async function checkDatabaseConnection(): Promise<void> {
  const db = getDb();
  await db.execute(sql`SELECT 1`);
}
