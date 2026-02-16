import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { analysisJobs } from './analysis-jobs'
import { analysisSubjects } from './analysis-subjects'

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  analysisJobId: uuid('analysis_job_id')
    .notNull()
    .unique()
    .references(() => analysisJobs.id),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => analysisSubjects.id),
  reportData: jsonb('report_data').notNull(),
  reportVersion: text('report_version'),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  viewedBySubject: boolean('viewed_by_subject').notNull().default(false),
  viewedBySubjectAt: timestamp('viewed_by_subject_at', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
