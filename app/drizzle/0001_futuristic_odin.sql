CREATE TABLE "research_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"topics" text[] DEFAULT '{}' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"items_found" integer DEFAULT 0 NOT NULL,
	"items_ingested" integer DEFAULT 0 NOT NULL,
	"sources" text[] DEFAULT '{}' NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "weekly_recaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_starting" date NOT NULL,
	"summary" text NOT NULL,
	"top_pick_ids" text[] DEFAULT '{}' NOT NULL,
	"themes" jsonb DEFAULT '[]' NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_recaps_week_starting_unique" UNIQUE("week_starting")
);
