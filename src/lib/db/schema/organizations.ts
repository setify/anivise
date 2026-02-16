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
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
