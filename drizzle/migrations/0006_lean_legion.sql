CREATE TYPE "public"."employee_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
ALTER TYPE "public"."media_context" ADD VALUE 'employee_avatar' BEFORE 'general';--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"position" text,
	"avatar_url" text,
	"avatar_storage_path" text,
	"department_id" uuid,
	"location_id" uuid,
	"manager_id" uuid,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_org_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."org_departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_location_id_org_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."org_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_organization_members_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_employees_org_id" ON "employees" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_employees_status" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_employees_department_id" ON "employees" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_employees_location_id" ON "employees" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_employees_manager_id" ON "employees" USING btree ("manager_id");