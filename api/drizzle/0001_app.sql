CREATE TYPE "public"."feedback_recommendation" AS ENUM('strong_no', 'no', 'yes', 'strong_yes');--> statement-breakpoint
CREATE TYPE "public"."meeting_platform" AS ENUM('zoom', 'google_meet');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('on_site', 'online');--> statement-breakpoint
CREATE TABLE "candidate" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_id_owner_id_unique" UNIQUE("id","owner_id"),
	CONSTRAINT "candidate_name_not_blank" CHECK (char_length(trim("candidate"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"recommendation" "feedback_recommendation" NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_meeting_id_unique" UNIQUE("meeting_id")
);
--> statement-breakpoint
CREATE TABLE "meeting" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"owner_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"type" "meeting_type" NOT NULL,
	"platform" "meeting_platform",
	"status" "meeting_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_end_after_start" CHECK ("meeting"."end_at" > "meeting"."start_at"),
	CONSTRAINT "meeting_platform_when_online" CHECK (("meeting"."type" = 'online') = ("meeting"."platform" is not null))
);
--> statement-breakpoint
CREATE TABLE "position" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "position_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_meeting_id_meeting_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_position_id_position_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."position"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_candidate_owner_fk" FOREIGN KEY ("candidate_id","owner_id") REFERENCES "public"."candidate"("id","owner_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "candidate_owner_id_name_idx" ON "candidate" USING btree ("owner_id","name");--> statement-breakpoint
CREATE INDEX "meeting_owner_id_start_at_idx" ON "meeting" USING btree ("owner_id","start_at");--> statement-breakpoint
CREATE INDEX "meeting_candidate_id_start_at_idx" ON "meeting" USING btree ("candidate_id","start_at");--> statement-breakpoint
CREATE INDEX "meeting_position_id_idx" ON "meeting" USING btree ("position_id");