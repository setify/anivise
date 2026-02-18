ALTER TABLE "organizations" ADD COLUMN "logo_storage_path" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "street" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "zip_code" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "country" text DEFAULT 'DE';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tax_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "brand_primary_color" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "brand_accent_color" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "brand_background_color" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "brand_text_color" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "favicon_storage_path" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "email_footer_text" text;