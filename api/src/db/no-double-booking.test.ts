import { join } from "node:path";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { candidate, meeting, position } from "./schema/app.ts";
import { user } from "./schema/auth.ts";
import { EXCLUSION_VIOLATION, findPgError } from "../lib/pg-error.ts";

// Real writes, so a throwaway PostgreSQL in Docker, not the compose database.
// Only a real database shows what happens when two requests arrive at once.
let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18").start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
  db = drizzle({ client: pool });
  await migrate(db, {
    migrationsFolder: join(import.meta.dirname, "../../drizzle"),
  });
}, 120_000);

afterAll(async () => {
  await pool?.end();
  await container?.stop();
});

describe("no double booking", () => {
  it("refuses one of two overlapping bookings sent at the same time", async () => {
    const [owner] = await db
      .insert(user)
      .values({ name: "Interviewer", email: "interviewer@example.com" })
      .returning();
    const [jane] = await db
      .insert(candidate)
      .values({ ownerId: owner.id, name: "Jane Doe" })
      .returning();
    const [role] = await db.select().from(position).limit(1);

    const book = (startAt: string, endAt: string) =>
      db.insert(meeting).values({
        ownerId: owner.id,
        candidateId: jane.id,
        positionId: role.id,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        type: "on_site",
      });

    // Two connections from the pool, so the inserts really run side by side.
    const results = await Promise.allSettled([
      book("2026-12-01T03:00:00Z", "2026-12-01T04:00:00Z"),
      book("2026-12-01T03:30:00Z", "2026-12-01T04:30:00Z"),
    ]);

    const refused = results.filter((r) => r.status === "rejected");
    expect(refused).toHaveLength(1);
    expect(findPgError(refused[0].reason)?.code).toBe(EXCLUSION_VIOLATION);
  });

  it("lets only pending and confirmed meetings hold their time", async () => {
    const [owner] = await db
      .insert(user)
      .values({ name: "Interviewer", email: "second@example.com" })
      .returning();
    const [jane] = await db
      .insert(candidate)
      .values({ ownerId: owner.id, name: "Jane Doe" })
      .returning();
    const [role] = await db.select().from(position).limit(1);
    const at = (startAt: string, endAt: string) => ({
      ownerId: owner.id,
      candidateId: jane.id,
      positionId: role.id,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      type: "on_site" as const,
    });

    // Completed early: the rest of its booked time is free again.
    await db.insert(meeting).values({
      ...at("2026-12-02T03:00:00Z", "2026-12-02T04:00:00Z"),
      status: "completed",
    });
    await db
      .insert(meeting)
      .values(at("2026-12-02T03:30:00Z", "2026-12-02T04:00:00Z"));

    // That new pending meeting holds its time.
    const clash = await db
      .insert(meeting)
      .values(at("2026-12-02T03:45:00Z", "2026-12-02T04:15:00Z"))
      .then(
        () => undefined,
        (err: unknown) => err,
      );
    expect(findPgError(clash)?.code).toBe(EXCLUSION_VIOLATION);
  });
});
