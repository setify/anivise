import { pgTable, uuid, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core'
import { subscriptionTierEnum, subscriptionStatusEnum, localeEnum } from './enums'

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  settings: jsonb('settings'),
  subscriptionTier: subscriptionTierEnum('subscription_tier')
    .notNull()
    .default('individual'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status')
    .notNull()
    .default('trial'),
  defaultLocale: localeEnum('default_locale'),
  maxMembers: integer('max_members'),
  maxAnalysesPerMonth: integer('max_analyses_per_month'),
  internalNotes: text('internal_notes'),

  // Logo
  logoStoragePath: text('logo_storage_path'),

  // Address
  street: text('street'),
  zipCode: text('zip_code'),
  city: text('city'),
  country: text('country').default('DE'),

  // Contact
  phone: text('phone'),
  email: text('email'),
  website: text('website'),

  // Business data
  taxId: text('tax_id'),
  industry: text('industry'),

  // Branding colors
  brandPrimaryColor: text('brand_primary_color'),
  brandAccentColor: text('brand_accent_color'),
  brandBackgroundColor: text('brand_background_color'),
  brandTextColor: text('brand_text_color'),

  // Favicon
  faviconStoragePath: text('favicon_storage_path'),

  // Email
  emailFooterText: text('email_footer_text'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
