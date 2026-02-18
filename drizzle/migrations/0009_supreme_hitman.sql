CREATE TABLE "analysis_recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"storage_path" text,
	"filename" text,
	"mime_type" text,
	"file_size" integer,
	"duration_seconds" integer,
	"language" text DEFAULT 'de' NOT NULL,
	"live_transcript" text,
	"final_transcript" text,
	"status" text DEFAULT 'recording' NOT NULL,
	"chunks_uploaded" integer DEFAULT 0 NOT NULL,
	"recorded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_recordings" ADD CONSTRAINT "analysis_recordings_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_recordings" ADD CONSTRAINT "analysis_recordings_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analysis_recordings_analysis_id" ON "analysis_recordings" USING btree ("analysis_id");