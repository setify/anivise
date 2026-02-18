ALTER TYPE "public"."media_context" ADD VALUE 'guide' BEFORE 'org_logo';--> statement-breakpoint
CREATE TABLE "guide_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guide_categories_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE "guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"icon" text DEFAULT 'FileText' NOT NULL,
	"storage_path" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"media_file_id" uuid,
	"access_managers" boolean DEFAULT true NOT NULL,
	"access_employees" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guide_categories" ADD CONSTRAINT "guide_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guides" ADD CONSTRAINT "guides_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guides" ADD CONSTRAINT "guides_category_id_guide_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."guide_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guides" ADD CONSTRAINT "guides_media_file_id_media_files_id_fk" FOREIGN KEY ("media_file_id") REFERENCES "public"."media_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guides" ADD CONSTRAINT "guides_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_guide_categories_org_id" ON "guide_categories" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_guides_org_id" ON "guides" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_guides_category_id" ON "guides" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_guides_org_category" ON "guides" USING btree ("organization_id","category_id");