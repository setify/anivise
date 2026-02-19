ALTER TABLE "analysis_dossiers" ADD COLUMN "is_test" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "analysis_jobs" ADD COLUMN "is_test" boolean DEFAULT false NOT NULL;