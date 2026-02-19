CREATE TYPE "public"."analysis_form_assignment_status" AS ENUM('pending', 'sent', 'opened', 'completed');--> statement-breakpoint
CREATE TABLE "analysis_form_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"form_version_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"token" text NOT NULL,
	"token_expires_at" timestamp with time zone NOT NULL,
	"assigned_by" uuid NOT NULL,
	"due_date" timestamp with time zone,
	"status" "analysis_form_assignment_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"submission_id" uuid,
	"reminder_count" integer DEFAULT 0 NOT NULL,
	"last_reminder_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_form_assignments_token_unique" UNIQUE("token"),
	CONSTRAINT "analysis_form_assignments_analysis_id_form_id_unique" UNIQUE("analysis_id","form_id")
);
--> statement-breakpoint
ALTER TABLE "analysis_form_assignments" ADD CONSTRAINT "analysis_form_assignments_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_form_assignments" ADD CONSTRAINT "analysis_form_assignments_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_form_assignments" ADD CONSTRAINT "analysis_form_assignments_form_version_id_form_versions_id_fk" FOREIGN KEY ("form_version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_form_assignments" ADD CONSTRAINT "analysis_form_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_form_assignments" ADD CONSTRAINT "analysis_form_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_form_assignments" ADD CONSTRAINT "analysis_form_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_form_assignments" ADD CONSTRAINT "analysis_form_assignments_submission_id_form_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analysis_form_assignments_token" ON "analysis_form_assignments" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_analysis_form_assignments_analysis_id" ON "analysis_form_assignments" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "idx_analysis_form_assignments_org_id" ON "analysis_form_assignments" USING btree ("organization_id");