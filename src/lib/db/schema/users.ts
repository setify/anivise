import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { localeEnum } from './enums'

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // matches Supabase Auth user ID
  email: text('email').unique().notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  isSuperadmin: boolean('is_superadmin').notNull().default(false),
  preferredLocale: localeEnum('preferred_locale').notNull().default('de'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
