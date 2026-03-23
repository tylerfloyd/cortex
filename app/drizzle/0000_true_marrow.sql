CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"parent_id" uuid,
	"is_ai_suggested" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_ai_generated" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"source_type" text NOT NULL,
	"title" text,
	"author" text,
	"published_at" timestamp with time zone,
	"raw_content" text,
	"summary" text,
	"key_insights" jsonb DEFAULT '[]'::jsonb,
	"category_id" uuid,
	"ai_model_used" text,
	"content_type" text,
	"difficulty_level" text,
	"estimated_read_time_minutes" integer,
	"processing_status" text DEFAULT 'pending',
	"embedding" vector(1536),
	"capture_source" text,
	"discord_channel" text,
	"user_notes" text,
	"is_favorite" boolean DEFAULT false,
	"read_count" integer DEFAULT 0,
	"markdown_file_path" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "items_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "item_tags" (
	"item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"confidence" real,
	CONSTRAINT "item_tags_item_id_tag_id_pk" PRIMARY KEY("item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "item_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_a_id" uuid NOT NULL,
	"item_b_id" uuid NOT NULL,
	"relation_type" text NOT NULL,
	"similarity" real,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'queued',
	"error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_relations" ADD CONSTRAINT "item_relations_item_a_id_items_id_fk" FOREIGN KEY ("item_a_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_relations" ADD CONSTRAINT "item_relations_item_b_id_items_id_fk" FOREIGN KEY ("item_b_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_log" ADD CONSTRAINT "job_log_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_items_category" ON "items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_items_source_type" ON "items" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_items_created_at" ON "items" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_relations_a_b_type" ON "item_relations" USING btree ("item_a_id","item_b_id","relation_type");