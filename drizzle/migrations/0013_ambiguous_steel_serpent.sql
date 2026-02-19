CREATE TYPE "public"."dossier_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "analysis_dossiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" "dossier_status" DEFAULT 'pending' NOT NULL,
	"prompt_text" text NOT NULL,
	"result_data" jsonb,
	"error_message" text,
	"model_used" text,
	"token_usage" jsonb,
	"requested_by" uuid NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_dossiers" ADD CONSTRAINT "analysis_dossiers_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_dossiers" ADD CONSTRAINT "analysis_dossiers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_dossiers" ADD CONSTRAINT "analysis_dossiers_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analysis_dossiers_analysis_id" ON "analysis_dossiers" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "idx_analysis_dossiers_org_id" ON "analysis_dossiers" USING btree ("organization_id");