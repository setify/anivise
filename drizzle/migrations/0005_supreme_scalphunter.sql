ALTER TYPE "public"."media_context" ADD VALUE 'user_avatar' BEFORE 'general';--> statement-breakpoint
CREATE TABLE "org_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_departments_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE "org_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"country" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_locations_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "location_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "deactivated_by" uuid;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD COLUMN "invited_first_name" text;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD COLUMN "invited_last_name" text;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD COLUMN "invited_position" text;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD COLUMN "invited_department_id" uuid;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD COLUMN "invited_location_id" uuid;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD COLUMN "temp_password_hash" text;--> statement-breakpoint
ALTER TABLE "org_departments" ADD CONSTRAINT "org_departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_locations" ADD CONSTRAINT "org_locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_departments_org_id" ON "org_departments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_locations_org_id" ON "org_locations" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_department_id_org_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."org_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_location_id_org_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."org_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_deactivated_by_users_id_fk" FOREIGN KEY ("deactivated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_department_id_org_departments_id_fk" FOREIGN KEY ("invited_department_id") REFERENCES "public"."org_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_location_id_org_locations_id_fk" FOREIGN KEY ("invited_location_id") REFERENCES "public"."org_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_members_status" ON "organization_members" USING btree ("status");