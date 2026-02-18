import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const organizationNotificationSettings = pgTable(
  'organization_notification_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // Limit warnings
    notifyLimitWarning80: boolean('notify_limit_warning_80').notNull().default(true),
    notifyLimitReached100: boolean('notify_limit_reached_100').notNull().default(true),

    // Analyses
    notifyAnalysisCompleted: boolean('notify_analysis_completed').notNull().default(true),
    notifyAnalysisFailed: boolean('notify_analysis_failed').notNull().default(true),

    // Team
    notifyMemberJoined: boolean('notify_member_joined').notNull().default(true),
    notifyMemberLeft: boolean('notify_member_left').notNull().default(false),
    notifyInvitationExpired: boolean('notify_invitation_expired').notNull().default(false),

    // Forms
    notifyFormSubmission: boolean('notify_form_submission').notNull().default(false),
    notifyFormAssigned: boolean('notify_form_assigned').notNull().default(true),

    // System
    notifyPlanChanged: boolean('notify_plan_changed').notNull().default(true),
    notifyMaintenance: boolean('notify_maintenance').notNull().default(true),

    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  }
)
