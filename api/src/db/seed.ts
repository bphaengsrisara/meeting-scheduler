import { eq } from "drizzle-orm";
import { auth } from "../auth/auth.ts";
import { env } from "../env.ts";
import { db, pool } from "./client.ts";
import { candidate, feedback, meeting, position } from "./schema/app.ts";
import { user } from "./schema/auth.ts";

// Sample data for one demo account, to show paging, filters and every
// meeting state. Each run deletes the account and makes it again, so two
// runs give the same data. Other accounts are not touched.

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "demo password for local use";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Times are office hours in Bangkok (UTC+7, no daylight saving).
const BANGKOK_OFFSET_MS = 7 * HOUR_MS;

// A time on a day counted from today in Bangkok: at(1, 9) is tomorrow at
// 9:00. Relative, so upcoming meetings stay upcoming whenever this runs.
function at(day: number, hour: number, minute = 0) {
  const bangkokNow = Date.now() + BANGKOK_OFFSET_MS;
  const today = bangkokNow - (bangkokNow % DAY_MS);
  return new Date(
    today + day * DAY_MS + (hour * 60 + minute) * 60_000 - BANGKOK_OFFSET_MS,
  );
}

type Recommendation = (typeof feedback.$inferInsert)["recommendation"];
type Status = (typeof meeting.$inferInsert)["status"];

const candidates = {
  // Two people with the same name, told apart by email.
  jane: { name: "Jane Doe", email: "jane.doe@example.com" },
  janeD: { name: "Jane Doe", email: "Jane.D@Example.org" },
  somchai: { name: "Somchai Kittisak", email: "somchai.k@example.com" },
  maria: {
    name: "Maria Fernanda de los Santos Rodríguez",
    email: "maria.santos.rodriguez@example.com",
    notes:
      "Referred by the QA lead. Strong on test planning and exploratory testing; less on automation. Ask about the flaky-test story from her last team, and whether she has used Playwright.",
  },
  arjun: { name: "Arjun Mehta", email: "arjun.mehta@example.com" },
  sofia: {
    name: "Sofia Lindqvist",
    email: "sofia.lindqvist@example.com",
    notes: "Strong React; ask about testing.",
  },
  daniel: { name: "Daniel Reyes", email: "daniel.reyes@example.com" },
  lucas: { name: "Lucas Martin", email: "lucas.martin@example.com" },
  ploy: { name: "Ploy Charoenwong", email: "ploy.c@example.com" },
  kenji: { name: "Kenji Watanabe", email: "kenji.w@example.com" },
  emily: { name: "Emily Chen", email: "emily.chen@example.com" },
  noah: { name: "Noah Williams", email: "noah.williams@example.com" },
  aisha: { name: "Aisha Rahman", email: "aisha.rahman@example.com" },
  tom: { name: "Tom Becker", email: "tom.becker@example.com" },
  napat: { name: "Napat Srisuk", email: "napat.srisuk@example.com" },
  // Their only meeting was deleted: the booking list says "No meetings yet".
  mira: { name: "Mira Okafor", email: "mira.okafor@example.com" },
};
type Who = keyof typeof candidates;
type Seeded = {
  who: Who;
  role: string;
  start: Date;
  // An hour when not given.
  minutes?: number;
  status: Status;
  // Onsite when not given.
  online?: "zoom" | "google_meet";
  notes?: string;
  // The recommendation and an optional comment.
  feedback?: [Recommendation, string?];
};

function meetings(): Seeded[] {
  const now = Date.now();
  const inProgress = new Date(now - 30 * 60_000);
  const heldNotConfirmed = new Date(now - 3 * HOUR_MS);
  // One meeting a line, to read as a table.
  // prettier-ignore
  return [
    // Started and not marked yet: they stay upcoming on the candidate page.
    { who: "somchai", role: "QA Engineer", start: inProgress, status: "confirmed", online: "zoom" },
    { who: "maria", role: "Senior QA Engineer", start: heldNotConfirmed, status: "pending", notes: "Held, but never confirmed: confirm it, then mark it completed." },
    { who: "tom", role: "Software Engineer", start: at(-1, 15), status: "confirmed", notes: "Not marked completed yet." },

    // History: every recommendation, with and without a comment.
    { who: "jane", role: "Frontend Developer", start: at(-12, 10), status: "completed", online: "google_meet", feedback: ["yes", "Good fundamentals, weak on SQL."] },
    { who: "sofia", role: "Frontend Developer", start: at(-9, 14), status: "completed", feedback: ["strong_yes", "Clear answers; built the take-home with tests."] },
    { who: "ploy", role: "Backend Developer", start: at(-8, 11), status: "completed", feedback: ["strong_no"] },
    { who: "lucas", role: "QA Engineer", start: at(-15, 13), status: "completed", feedback: ["no", "Applied for QA; better suited to backend. Invited to the backend round."] },
    { who: "arjun", role: "Software Engineer", start: at(-2, 10), status: "completed" },
    { who: "daniel", role: "Backend Developer", start: at(-6, 16), status: "cancelled", notes: "Candidate asked to move it." },
    // Completed early: the second was booked after the first had finished,
    // so History shows two booked times that overlap.
    { who: "emily", role: "Software Engineer", start: at(-3, 10), minutes: 90, status: "completed", feedback: ["yes"] },
    { who: "kenji", role: "Backend Developer", start: at(-3, 11), status: "completed" },

    // Upcoming: enough for three pages of ten on the dashboard.
    { who: "jane", role: "Frontend Developer", start: at(1, 9), status: "confirmed", notes: "Second round, bring the take-home." },
    { who: "janeD", role: "Backend Developer", start: at(1, 11), status: "pending", online: "zoom" },
    // Back to back: one ends as the next starts.
    { who: "kenji", role: "Backend Developer", start: at(2, 13), status: "confirmed", online: "google_meet" },
    { who: "noah", role: "QA Engineer", start: at(2, 14), status: "pending" },
    { who: "arjun", role: "Software Engineer", start: at(3, 10), minutes: 90, status: "pending", online: "google_meet" },
    { who: "lucas", role: "Backend Developer", start: at(3, 15), status: "confirmed" },
    { who: "aisha", role: "Senior QA Engineer", start: at(4, 9), status: "pending", online: "zoom" },
    { who: "napat", role: "Frontend Developer", start: at(4, 13), minutes: 45, status: "confirmed" },
    { who: "sofia", role: "Frontend Developer", start: at(5, 10), status: "confirmed", online: "zoom", notes: "Final round with the team lead." },
    { who: "ploy", role: "QA Engineer", start: at(6, 14), status: "pending" },
    { who: "emily", role: "Software Engineer", start: at(7, 9), minutes: 120, status: "confirmed", notes: "Pair-programming session." },
    { who: "noah", role: "QA Engineer", start: at(8, 11), status: "pending", online: "google_meet" },
    { who: "tom", role: "Backend Developer", start: at(9, 10), status: "pending" },
    { who: "aisha", role: "Senior QA Engineer", start: at(10, 15), status: "confirmed", online: "zoom" },
    { who: "napat", role: "Frontend Developer", start: at(11, 9), status: "pending" },
    { who: "maria", role: "Senior QA Engineer", start: at(12, 13), status: "pending", online: "google_meet" },
    { who: "somchai", role: "QA Engineer", start: at(13, 10), status: "confirmed" },
    { who: "kenji", role: "Backend Developer", start: at(14, 14), status: "pending", online: "zoom" },
    { who: "lucas", role: "Backend Developer", start: at(15, 11), status: "pending" },
    { who: "jane", role: "Frontend Developer", start: at(16, 9), status: "pending", online: "google_meet" },
    { who: "arjun", role: "Software Engineer", start: at(18, 13), status: "confirmed" },
    { who: "noah", role: "QA Engineer", start: at(20, 10), status: "pending" },
    // Cancelled ahead of time, and booked again on another day.
    { who: "daniel", role: "Backend Developer", start: at(5, 14), status: "cancelled", notes: "Cancelled by mistake; booked again." },
    { who: "daniel", role: "Backend Developer", start: at(6, 10), status: "confirmed" },
    { who: "aisha", role: "Senior QA Engineer", start: at(17, 10), status: "cancelled", notes: "Candidate withdrew." },
  ];
}

export async function seed() {
  if (env.NODE_ENV === "production") {
    throw new Error("The seed is sample data; it does not run in production.");
  }
  // The demo account's candidates, meetings and feedback go with it.
  await db.delete(user).where(eq(user.email, DEMO_EMAIL));
  const { user: demo } = await auth.api.signUpEmail({
    body: {
      name: "Demo Interviewer",
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    },
  });

  await db.transaction(async (tx) => {
    const positions = await tx.select().from(position);
    const positionId = (name: string) => {
      const found = positions.find((p) => p.name === name);
      if (!found) throw new Error(`No position named ${name}`);
      return found.id;
    };

    const added = await tx
      .insert(candidate)
      .values(
        Object.values(candidates).map((c) => ({ ...c, ownerId: demo.id })),
      )
      .returning({ id: candidate.id, email: candidate.email });
    const idOf = (who: Who) => {
      const found = added.find((c) => c.email === candidates[who].email);
      if (!found) throw new Error(`No candidate ${who}`);
      return found.id;
    };

    const list = meetings();
    const saved = await tx
      .insert(meeting)
      .values(
        list.map((m) => ({
          ownerId: demo.id,
          candidateId: idOf(m.who),
          positionId: positionId(m.role),
          startAt: m.start,
          endAt: new Date(m.start.getTime() + (m.minutes ?? 60) * 60_000),
          type: m.online ? ("online" as const) : ("on_site" as const),
          platform: m.online ?? null,
          status: m.status,
          notes: m.notes ?? null,
        })),
      )
      .returning({
        id: meeting.id,
        candidateId: meeting.candidateId,
        startAt: meeting.startAt,
      });
    // Each seeded meeting has its own candidate and start, which find its id.
    const savedId = (m: Seeded) => {
      const found = saved.find(
        (row) =>
          row.candidateId === idOf(m.who) &&
          row.startAt.getTime() === m.start.getTime(),
      );
      if (!found) throw new Error(`No meeting for ${m.who}`);
      return found.id;
    };
    await tx.insert(feedback).values(
      list.flatMap((m) =>
        m.feedback
          ? [
              {
                meetingId: savedId(m),
                recommendation: m.feedback[0],
                comment: m.feedback[1] ?? null,
              },
            ]
          : [],
      ),
    );
  });
}

if (import.meta.main) {
  await seed();
  await pool.end();
  console.log(`Seeded. Log in as ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}
