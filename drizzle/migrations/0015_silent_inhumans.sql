ALTER TABLE "organization_products" ADD COLUMN "override_allow_forms" boolean;--> statement-breakpoint
ALTER TABLE "organization_products" ADD COLUMN "override_allow_api_access" boolean;--> statement-breakpoint
ALTER TABLE "organization_products" ADD COLUMN "override_allow_custom_branding" boolean;--> statement-breakpoint
ALTER TABLE "organization_products" ADD COLUMN "override_allow_email_templates" boolean;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allow_forms" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allow_api_access" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allow_custom_branding" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allow_email_templates" boolean DEFAULT false NOT NULL;