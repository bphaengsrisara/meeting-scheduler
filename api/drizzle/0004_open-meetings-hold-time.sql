-- Only meetings still to happen hold their time: a completed meeting is over
-- and a cancelled one called off, so neither blocks a new booking.
-- Written by hand, like the constraint it replaces (0002).
ALTER TABLE "meeting" DROP CONSTRAINT "meeting_no_overlap";--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_no_overlap" EXCLUDE USING gist (
	"owner_id" WITH =,
	tstzrange("start_at", "end_at") WITH &&
) WHERE ("status" IN ('pending', 'confirmed'));
