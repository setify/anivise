CREATE TABLE "org_email_template_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"template_slug" text NOT NULL,
	"subject_de" text NOT NULL,
	"subject_en" text NOT NULL,
	"body_de" text NOT NULL,
	"body_en" text NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_email_template_overrides" ADD CONSTRAINT "org_email_template_overrides_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_email_template_overrides" ADD CONSTRAINT "org_email_template_overrides_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "org_email_tpl_override_org_slug_idx" ON "org_email_template_overrides" USING btree ("organization_id","template_slug");--> statement-breakpoint
CREATE INDEX "org_email_tpl_override_org_idx" ON "org_email_template_overrides" USING btree ("organization_id");