CREATE TABLE "organization_notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"notify_limit_warning_80" boolean DEFAULT true NOT NULL,
	"notify_limit_reached_100" boolean DEFAULT true NOT NULL,
	"notify_analysis_completed" boolean DEFAULT true NOT NULL,
	"notify_analysis_failed" boolean DEFAULT true NOT NULL,
	"notify_member_joined" boolean DEFAULT true NOT NULL,
	"notify_member_left" boolean DEFAULT false NOT NULL,
	"notify_invitation_expired" boolean DEFAULT false NOT NULL,
	"notify_form_submission" boolean DEFAULT false NOT NULL,
	"notify_form_assigned" boolean DEFAULT true NOT NULL,
	"notify_plan_changed" boolean DEFAULT true NOT NULL,
	"notify_maintenance" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_notification_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "organization_notification_settings" ADD CONSTRAINT "organization_notification_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_notification_settings" ADD CONSTRAINT "organization_notification_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;