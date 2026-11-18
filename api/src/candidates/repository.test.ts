import { join } from "node:path";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { candidate, meeting, position } from "../db/schema/app.ts";
import { user } from "../db/schema/auth.ts";
import { searchCandidates } from "./repository.ts";

// The search runs its SQL on a throwaway PostgreSQL in Docker, which the
// repository gets in place of the compose database's client.
const testDb = vi.hoisted(() => ({ current: undefined as unknown }));
vi.mock("../db/client.ts", () => ({
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

describe("searchCandidates", () => {
  it("tells apart two candidates with the same name by their latest meeting", async () => {
    const [owner] = await db
      .insert(user)
      .values({ name: "Interviewer", email: "interviewer@example.com" })
      .returning();
    const [first, second] = await db
      .insert(candidate)
      .values([
        { ownerId: owner.id, name: "Lucas Martin" },
        { ownerId: owner.id, name: "Lucas Martin" },
      ])
      .returning();
    const [qa, backend] = await db.select().from(position).limit(2);
    const book = (
      candidateId: string,
      positionId: string,
      startAt: string,
    ) => ({
      ownerId: owner.id,
      candidateId,
      positionId,
      startAt: new Date(startAt),
      endAt: new Date(new Date(startAt).getTime() + 60 * 60 * 1000),
      type: "on_site" as const,
    });
    await db
      .insert(meeting)
      .values([
        book(first.id, qa.id, "2026-12-01T03:00:00Z"),
        book(first.id, backend.id, "2026-12-08T03:00:00Z"),
      ]);

    const found = await searchCandidates(owner.id, "lucas");

    expect(found).toHaveLength(2);
    expect(found).toContainEqual({
      id: first.id,
      name: "Lucas Martin",
      latestPositionId: backend.id,
      latestStartAt: new Date("2026-12-08T03:00:00Z"),
    });
    // No meetings yet: nothing to show beside the name.
    expect(found).toContainEqual({
      id: second.id,
      name: "Lucas Martin",
      latestPositionId: null,
      latestStartAt: null,
    });
  });
});
