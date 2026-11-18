# Database

PostgreSQL 18. The tables are defined in `api/src/db/schema/`, and the
migrations are in `api/drizzle/`.

## No double booking

One user's meetings cannot overlap, unless one is cancelled. An account is
one interviewer, and one person cannot be in two meetings at once; a team
with several interviewers uses several accounts.

The rule lives in the database, not only in the API. A check in the API
reads and then writes, so two requests sent at the same moment can both
pass it. PostgreSQL refuses the second instead, and the API turns its error
(23P01) into a 409.

`api/drizzle/0002_no-double-booking.sql`:

```sql
EXCLUDE USING gist (owner_id WITH =, tstzrange(start_at, end_at) WITH &&)
WHERE (status <> 'cancelled')
```

- `tstzrange(start_at, end_at)` includes the start and leaves out the end,
  and `&&` asks whether two ranges have any moment in common. So a meeting
  that ends at 10:00 and one that starts at 10:00 do not overlap. Scheduling
  products allow back-to-back meetings too; a gap between them is an
  optional buffer setting, which this app does not have.
- `btree_gist`, supplied with PostgreSQL, lets the same index compare
  `owner_id` with `=`.
- Drizzle cannot declare an exclusion constraint, so this is a hand-written
  drizzle-kit migration (`drizzle-kit generate --custom`).
- `api/src/db/no-double-booking.test.ts` sends two overlapping
  bookings at once to a real PostgreSQL (Testcontainers); one is refused.

## The owner is stored twice, and kept equal

`owner_id` is on both `candidate` and `meeting`. The overlap rule needs it
on `meeting`, because a constraint cannot read another table.

A composite foreign key, `meeting (candidate_id, owner_id)` →
`candidate (id, owner_id)`, keeps the two copies equal for every writer, not
only the API. A meeting cannot be booked with another user's candidate: the
database refuses it, and the API answers 400. With `on update cascade`, when
a candidate's owner changes, its meetings follow in the same update.

## Positions

The positions are an admin's list: everyone books against the same open
roles, and there is no screen to edit them.
`api/drizzle/0003_positions.sql` inserts them, so `db:migrate` alone gives
a working booking form. A real product would keep this list out of the
migrations, for an admin to manage.

## Types

- Times are `timestamptz`, stored in UTC; the web app shows local time.
- Strings are `text`, with no length in the database: PostgreSQL's docs say
  `text` and `varchar(n)` perform the same. The limits (a name up to 100
  characters, notes up to 2000) are in the Zod schemas.

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
