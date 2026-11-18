# Database

PostgreSQL 18. The tables are defined in `api/src/db/schema/`, and the
migrations are in `api/drizzle/`.

## No double booking

One user's meetings still to happen (pending or confirmed) cannot overlap. A
completed meeting is over and a cancelled one called off, so neither holds
its time: a meeting completed before its booked end frees the rest. An account is
one interviewer, and one person cannot be in two meetings at once; a team
with several interviewers uses several accounts.

The rule lives in the database, not only in the API. A check in the API
reads and then writes, so two requests sent at the same moment can both
pass it. PostgreSQL refuses the second instead, and the API turns its error
(23P01) into a 409.

`api/drizzle/0002_no-double-booking.sql`, rebuilt by
`0004_open-meetings-hold-time.sql` to cover only meetings still to happen:

```sql
EXCLUDE USING gist (owner_id WITH =, tstzrange(start_at, end_at) WITH &&)
WHERE (status IN ('pending', 'confirmed'))
```

- `tstzrange(start_at, end_at)` includes the start and leaves out the end,
  and `&&` asks whether two ranges have any moment in common. So a meeting
  that ends at 10:00 and one that starts at 10:00 do not overlap. Google
  Calendar's appointment schedules allow back-to-back meetings too; a gap
  between them is an optional buffer setting, which this app does not have.
- `btree_gist`, supplied with PostgreSQL, lets the same index compare
  `owner_id` with `=`.
- Drizzle cannot declare an exclusion constraint, so this is a hand-written
  drizzle-kit migration (`drizzle-kit generate --custom`).
- `api/src/db/no-double-booking.test.ts` sends two overlapping
  bookings at once to a real PostgreSQL (Testcontainers); one is refused.
  It also checks that a completed meeting does not block a new one.
- A completed meeting keeps its booked start and end, even when it finished
  early. The moment someone marks it completed is not the real end (it can
  be pressed during the meeting or hours later), and the iCalendar
  standard (RFC 5545) keeps the booked times too, with no "actual end"
  field. So History can show two meetings whose booked times overlap: the
  second was booked after the first had finished.

## The owner is stored twice, and kept equal

`owner_id` is on both `candidate` and `meeting`. The overlap rule needs it
on `meeting`, because a constraint cannot read another table.

A composite foreign key, `meeting (candidate_id, owner_id)` →
`candidate (id, owner_id)`, keeps the two copies equal for every writer, not
only the API. A meeting cannot be booked with another user's candidate: the
database refuses it, and the API answers 400. With `on update cascade`, when
a guest's candidates move to their account, their meetings follow in the
same update.

## One candidate per email

Two candidates can share a name, so each has an email to tell them apart. A
unique index on `(owner_id, lower(email))` keeps one candidate per email in
each account, for every writer: `Jane@Example.com` and `jane@example.com`
count as the same. The email is stored as typed. The index is per account,
so two interviewers can each have the same person as a candidate. The API
turns the refusal (23505) into a 409.

## Positions

The positions are an admin's list: everyone books against the same open
roles, and there is no screen to edit them.
`api/drizzle/0003_positions.sql` inserts them, so `db:migrate` alone gives
a working booking form. A real product would keep this list out of the
migrations, for an admin to manage.

## Sample data

`pnpm --filter api db:seed` runs `api/src/db/seed.ts`. It makes the account
`demo@example.com` with candidates and meetings in every state, dated from
the day it runs, so the dashboard has pages to go through and History has
feedback. Each run deletes that account and makes it again: two runs give
the same data, and other accounts are not touched. It refuses to run when
`NODE_ENV=production`.

The positions are not part of it: the booking form needs them on every
database, so a migration adds them (see [Positions](#positions)). The seed
is only sample data.

### Why TypeScript and not a SQL file

The seed writes rows straight to the database rather than through the API,
because the API refuses meetings in the past, and History needs some.
Written in TypeScript:

- The demo account is made by a real sign-up (`auth.api.signUpEmail`, the
  same call behind `POST /api/auth/sign-up/email`): the same password rules
  and the same Argon2id hash as any user. A SQL file would need a password
  hash computed once and pasted in.
- The rows go through Drizzle, like every other write in the app, and are
  type-checked against the schema: a renamed column fails `tsc`. A SQL file
  would only fail when it runs.
- It does not depend on how Better Auth stores a login (its `account` row,
  the `credential` provider); a SQL file would write those rows by hand.
- Dates are relative to now in one small helper, so upcoming meetings stay
  upcoming whenever it runs.

What a SQL file would do better, and what this costs:

- SQL reads as plain data and is shorter; the TypeScript has some plumbing
  (the date helper, looking up ids by name, matching each meeting to its feedback). The meeting
  list is kept one meeting a line, so it still reads as a table.
- SQL needs only `psql`; the TypeScript needs the API's environment
  (`api/.env`) to load, as the API itself does.
- The project would then have two ways of writing data (hand-written SQL
  for the migrations that Drizzle cannot express, and Drizzle elsewhere)
  plus a third for the seed; TypeScript keeps it to the two.

`api/src/db/seed.test.ts` runs the seed twice on a throwaway PostgreSQL
(Testcontainers) and checks that the counts stay the same, that another
account's data is untouched, and that every meeting status and every
recommendation is there.

## Types

- Times are `timestamptz`, stored in UTC; the web app shows local time.
- Strings are `text`, with no length in the database: PostgreSQL's docs say
  `text` and `varchar(n)` have no performance difference, apart from the
  length check. The limits (a name up to 100
  characters, an email up to 254, notes up to 2000) are in the Zod schemas.

## References

- PostgreSQL 18:
  [Exclusion Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION),
  [Constraints on Ranges](https://www.postgresql.org/docs/18/rangetypes.html#RANGETYPES-CONSTRAINT),
  [Range Functions and Operators](https://www.postgresql.org/docs/18/functions-range.html),
  [btree_gist](https://www.postgresql.org/docs/18/btree-gist.html),
  [Character Types](https://www.postgresql.org/docs/18/datatype-character.html)
  (the Tip)
- Drizzle:
  [Custom migrations](https://orm.drizzle.team/docs/kit-custom-migrations)
- Google Calendar Help:
  [appointment schedules](https://support.google.com/calendar/answer/11423292?hl=en)
  (buffer time)
- iCalendar:
  [RFC 5545, section 3.6.1](https://www.rfc-editor.org/rfc/rfc5545.html#section-3.6.1)
  (an event's properties: a start, and an end or a duration)
