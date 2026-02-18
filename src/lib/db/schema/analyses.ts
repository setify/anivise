import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { analysisStatusEnum } from './enums'
import { organizations } from './organizations'
import { employees } from './employees'
import { users } from './users'

/**
 * Core analyses table — one row per analysis session.
 * Independent from analysis_jobs (n8n pipeline).
 */
export const analyses = pgTable(
  'analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    name: text('name').notNull(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id),
    managerId: uuid('manager_id')
      .notNull()
      .references(() => users.id),
    status: analysisStatusEnum('status').notNull().default('planned'),
    archived: boolean('archived').notNull().default(false),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_analyses_org_id').on(table.organizationId),
    index('idx_analyses_employee_id').on(table.employeeId),
    index('idx_analyses_manager_id').on(table.managerId),
    index('idx_analyses_status').on(table.status),
  ]
)

/**
 * Sharing: grants another user full access to an analysis.
 */
export const analysisShares = pgTable(
  'analysis_shares',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    sharedWithUserId: uuid('shared_with_user_id')
      .notNull()
      .references(() => users.id),
    sharedByUserId: uuid('shared_by_user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_analysis_shares_analysis_id').on(table.analysisId),
    index('idx_analysis_shares_shared_with').on(table.sharedWithUserId),
  ]
)

/**
 * Comment feed for an analysis (notes with author + timestamp).
 */
export const analysisComments = pgTable(
  'analysis_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_analysis_comments_analysis_id').on(table.analysisId),
  ]
)
