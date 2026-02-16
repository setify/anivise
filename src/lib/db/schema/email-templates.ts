import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  subjectDe: text('subject_de').notNull(),
  subjectEn: text('subject_en').notNull(),
  bodyDe: text('body_de').notNull(),
  bodyEn: text('body_en').notNull(),
  availableVariables: jsonb('available_variables').notNull(),
  isSystem: boolean('is_system').notNull().default(true),
  lastTestSentAt: timestamp('last_test_sent_at', { withTimezone: true }),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
