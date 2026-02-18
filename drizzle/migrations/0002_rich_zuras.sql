CREATE TYPE "public"."media_context" AS ENUM('email_logo', 'email_template', 'form_header', 'org_logo', 'report_asset', 'general');--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket" text NOT NULL,
	"path" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"context" "media_context" DEFAULT 'general' NOT NULL,
	"context_entity_id" text,
	"uploaded_by" uuid NOT NULL,
	"alt_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_media_files_bucket_path" ON "media_files" USING btree ("bucket","path");--> statement-breakpoint
CREATE INDEX "idx_media_files_context" ON "media_files" USING btree ("context");--> statement-breakpoint
CREATE INDEX "idx_media_files_uploaded_by" ON "media_files" USING btree ("uploaded_by");