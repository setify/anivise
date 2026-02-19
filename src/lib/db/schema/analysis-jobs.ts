import { pgTable, uuid, text, jsonb, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { jobStatusEnum } from './enums'
import { organizations } from './organizations'
import { analysisSubjects } from './analysis-subjects'
import { consents } from './consents'
import { users } from './users'

export const analysisJobs = pgTable(
  'analysis_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => analysisSubjects.id),
    consentId: uuid('consent_id')
      .notNull()
      .references(() => consents.id),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id),
    status: jobStatusEnum('status').notNull().default('pending'),
    transcriptStoragePath: text('transcript_storage_path').notNull(),
    n8nWebhookTriggeredAt: timestamp('n8n_webhook_triggered_at', {
      withTimezone: true,
    }),
    n8nCallbackReceivedAt: timestamp('n8n_callback_received_at', {
      withTimezone: true,
    }),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata'),
    isTest: boolean('is_test').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_analysis_jobs_org_id').on(table.organizationId),
    index('idx_analysis_jobs_status').on(table.status),
    index('idx_analysis_jobs_subject_id').on(table.subjectId),
    index('idx_analysis_jobs_requested_by').on(table.requestedBy),
  ]
)
