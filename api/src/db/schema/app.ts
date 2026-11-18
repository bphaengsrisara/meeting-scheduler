import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

// The app's own tables. The rule that one user's meetings cannot overlap is
// not here: Drizzle cannot declare it, so it is in a SQL migration.

const id = () =>
  uuid("id")
    .default(sql`uuidv7()`)
    .primaryKey();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

export const meetingStatus = pgEnum("meeting_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);
export const meetingType = pgEnum("meeting_type", ["on_site", "online"]);
export const meetingPlatform = pgEnum("meeting_platform", [
  "zoom",
  "google_meet",
]);
export const feedbackRecommendation = pgEnum("feedback_recommendation", [
  "strong_no",
  "no",
  "yes",
  "strong_yes",
]);

// The roles a meeting can be for. Filled by a migration; no screen edits it.
export const position = pgTable("position", {
  id: id(),
  name: text("name").notNull().unique(),
  createdAt: createdAt(),
});

export const candidate = pgTable(
  "candidate",
  {
    id: id(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // The target of meeting's (candidate_id, owner_id) foreign key.
    unique("candidate_id_owner_id_unique").on(t.id, t.ownerId),
    index("candidate_owner_id_name_idx").on(t.ownerId, t.name),
    check("candidate_name_not_blank", sql`char_length(trim(${t.name})) > 0`),
  ],
);

export const meeting = pgTable(
  "meeting",
  {
    id: id(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id").notNull(),
    positionId: uuid("position_id")
      .notNull()
      .references(() => position.id, { onDelete: "restrict" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    type: meetingType("type").notNull(),
    platform: meetingPlatform("platform"),
    status: meetingStatus("status").default("pending").notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // A meeting's owner is always its candidate's owner. When a candidate
    // moves to another user, its meetings move with it.
    foreignKey({
      name: "meeting_candidate_owner_fk",
      columns: [t.candidateId, t.ownerId],
      foreignColumns: [candidate.id, candidate.ownerId],
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    index("meeting_owner_id_start_at_idx").on(t.ownerId, t.startAt),
    index("meeting_candidate_id_start_at_idx").on(t.candidateId, t.startAt),
    index("meeting_position_id_idx").on(t.positionId),
    check("meeting_end_after_start", sql`${t.endAt} > ${t.startAt}`),
    check(
      "meeting_platform_when_online",
      sql`(${t.type} = 'online') = (${t.platform} is not null)`,
    ),
  ],
);

// At most one per meeting, added once the meeting is completed.
export const feedback = pgTable("feedback", {
  id: id(),
  meetingId: uuid("meeting_id")
    .notNull()
    .unique()
    .references(() => meeting.id, { onDelete: "cascade" }),
  recommendation: feedbackRecommendation("recommendation").notNull(),
  comment: text("comment"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
