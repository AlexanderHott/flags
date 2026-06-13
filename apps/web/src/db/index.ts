import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { envServer } from "#/env";

import * as schema from "./schema.ts";

export const db = drizzle(envServer.DATABASE_URL, { schema });

await migrate(db, { migrationsFolder: "./drizzle/" });
