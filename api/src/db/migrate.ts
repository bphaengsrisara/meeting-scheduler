import { join } from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client.ts";

// Applies the migrations in drizzle/ that the database has not run yet. The
// container runs this before the API starts, without drizzle-kit, which is a
// development tool; locally, db:migrate does the same with drizzle-kit.
await migrate(db, {
  migrationsFolder: join(import.meta.dirname, "../../drizzle"),
});
await pool.end();
