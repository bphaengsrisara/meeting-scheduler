import { join } from "node:path";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { count, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { candidate, feedback, meeting } from "./schema/app.ts";
import { user } from "./schema/auth.ts";

// The seed runs on a throwaway PostgreSQL in Docker, which the app's code
// (Better Auth included) gets in place of the compose database's client.
const testDb = vi.hoisted(() => ({ current: undefined as unknown }));
vi.mock("./client.ts", () => ({
  get db() {
    return testDb.current;
  },
}));

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18").start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
  db = drizzle({ client: pool });
  testDb.current = db;
  await migrate(db, {
    migrationsFolder: join(import.meta.dirname, "../../drizzle"),
  });
}, 120_000);

afterAll(async () => {
  await pool?.end();
  await container?.stop();
});

const counts = async () => {
  const [row] = await db
    .select({
      users: db.$count(user),
      candidates: db.$count(candidate),
      meetings: db.$count(meeting),
      feedback: db.$count(feedback),
    })
    .from(user)
    .limit(1);
  return row;
};

describe("seed", () => {
  it("gives the same data when run twice, and leaves other accounts alone", async () => {
    // Imported here: Better Auth reads the database client when it loads.
    const { seed, DEMO_EMAIL } = await import("./seed.ts");
    const [other] = await db
      .insert(user)
      .values({ name: "Someone Else", email: "someone@example.com" })
      .returning();
    await db.insert(candidate).values({
      ownerId: other.id,
      name: "Jane Doe",
      email: "jane.doe@example.com",
    });

    await seed();
    const first = await counts();
    await seed();
    const second = await counts();

    expect(second).toEqual(first);
    expect(first.users).toBe(2);
    expect(first.candidates).toBeGreaterThan(10);
    const demo = await db
      .select({ value: count() })
      .from(user)
      .where(eq(user.email, DEMO_EMAIL));
    expect(demo[0].value).toBe(1);
    const others = await db
      .select({ value: count() })
      .from(candidate)
      .where(eq(candidate.ownerId, other.id));
    expect(others[0].value).toBe(1);
  }, 60_000);

  // Reads what the runs above wrote.
  it("holds every meeting status and every recommendation", async () => {
    const statuses = await db
      .selectDistinct({ value: meeting.status })
      .from(meeting);
    const recommendations = await db
      .selectDistinct({ value: feedback.recommendation })
      .from(feedback);

    expect(statuses).toHaveLength(4);
    expect(recommendations).toHaveLength(4);
  });
});
