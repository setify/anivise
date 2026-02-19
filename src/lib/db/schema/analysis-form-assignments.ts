import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { analysisFormAssignmentStatusEnum } from './enums'
import { analyses } from './analyses'
import { forms, formVersions, formSubmissions } from './forms'
import { organizations } from './organizations'
import { employees } from './employees'
import { users } from './users'

export const analysisFormAssignments = pgTable(
  'analysis_form_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    formId: uuid('form_id')
      .notNull()
      .references(() => forms.id),
    formVersionId: uuid('form_version_id')
      .notNull()
      .references(() => formVersions.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id),
    token: text('token').unique().notNull(),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }).notNull(),
    assignedBy: uuid('assigned_by')
      .notNull()
      .references(() => users.id),
    dueDate: timestamp('due_date', { withTimezone: true }),
    status: analysisFormAssignmentStatusEnum('status').notNull().default('pending'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    openedAt: timestamp('opened_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    submissionId: uuid('submission_id').references(() => formSubmissions.id),
    reminderCount: integer('reminder_count').notNull().default(0),
    lastReminderAt: timestamp('last_reminder_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique().on(table.analysisId, table.formId),
    index('idx_analysis_form_assignments_token').on(table.token),
    index('idx_analysis_form_assignments_analysis_id').on(table.analysisId),
    index('idx_analysis_form_assignments_org_id').on(table.organizationId),
  ]
)
