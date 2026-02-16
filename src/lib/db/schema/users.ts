import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { localeEnum, platformRoleEnum } from './enums'

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // matches Supabase Auth user ID
  email: text('email').unique().notNull(),
  fullName: text('full_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  displayName: text('display_name'),
  phone: text('phone'),
  timezone: text('timezone').default('Europe/Berlin'),
  avatarUrl: text('avatar_url'),
  avatarStoragePath: text('avatar_storage_path'),
  platformRole: platformRoleEnum('platform_role'),
  preferredLocale: localeEnum('preferred_locale').notNull().default('de'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
