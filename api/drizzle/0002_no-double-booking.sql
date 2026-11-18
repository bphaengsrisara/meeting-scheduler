-- One user cannot have two meetings at the same time, unless one is cancelled.
-- Written by hand: Drizzle cannot declare an exclusion constraint.
-- btree_gist ships with PostgreSQL; it lets a GiST index compare owner_id with =.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_no_overlap" EXCLUDE USING gist (
	"owner_id" WITH =,
	tstzrange("start_at", "end_at") WITH &&
) WHERE ("status" <> 'cancelled');
