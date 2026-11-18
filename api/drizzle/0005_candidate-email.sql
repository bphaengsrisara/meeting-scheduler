ALTER TABLE "candidate" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_owner_id_email_unique" ON "candidate" USING btree ("owner_id",lower("email"));--> statement-breakpoint
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_email_not_blank" CHECK (char_length(trim("candidate"."email")) > 0);