import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { dossierStatusEnum } from './enums'
import { analyses } from './analyses'
import { organizations } from './organizations'
import { users } from './users'

export const analysisDossiers = pgTable(
  'analysis_dossiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    status: dossierStatusEnum('status').notNull().default('pending'),
    promptText: text('prompt_text').notNull(),
    resultData: jsonb('result_data'),
    errorMessage: text('error_message'),
    modelUsed: text('model_used'),
    tokenUsage: jsonb('token_usage'),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id),
    isTest: boolean('is_test').notNull().default(false),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_analysis_dossiers_analysis_id').on(table.analysisId),
    index('idx_analysis_dossiers_org_id').on(table.organizationId),
  ]
)
