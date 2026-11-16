import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env.ts";

// One connection pool for the whole API.
export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle({ client: pool });
