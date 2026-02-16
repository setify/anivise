import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { consentTypeEnum, consentStatusEnum } from './enums'
import { organizations } from './organizations'
import { analysisSubjects } from './analysis-subjects'
import { users } from './users'

export const consents = pgTable('consents', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => analysisSubjects.id),
  grantedByUserId: uuid('granted_by_user_id').references(() => users.id),
  consentType: consentTypeEnum('consent_type').notNull(),
  status: consentStatusEnum('status').notNull().default('active'),
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  ipAddress: text('ip_address'),
  consentTextVersion: text('consent_text_version'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
