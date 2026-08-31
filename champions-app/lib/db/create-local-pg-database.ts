import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export function createLocalPgDatabase(
  connectionString: string
): NodePgDatabase<typeof schema> {
  const pool = new Pool({ connectionString, max: 10 });
  return drizzle(pool, { schema });
}
