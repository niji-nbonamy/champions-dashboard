import { execFileSync } from "node:child_process";

import {
  resolveDatabaseUrlOrThrow,
  resolveUnpooledDatabaseUrl,
} from "./test-env";

export default function globalSetup(): void {
  const databaseUrl = resolveDatabaseUrlOrThrow();
  const unpooledDatabaseUrl = resolveUnpooledDatabaseUrl(databaseUrl);

  execFileSync("npm", ["run", "db:push"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DATABASE_URL_UNPOOLED: unpooledDatabaseUrl,
    },
    stdio: "inherit",
  });
}
