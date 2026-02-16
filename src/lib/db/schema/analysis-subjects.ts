import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const analysisSubjects = pgTable('analysis_subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  fullName: text('full_name').notNull(),
  email: text('email'),
  roleTitle: text('role_title'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
