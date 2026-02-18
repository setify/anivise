import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import {
  platformRoleEnum,
  invitationStatusEnum,
  invitationTypeEnum,
  orgMemberRoleEnum,
} from './enums'
import { users } from './users'
import { organizations } from './organizations'
import { orgDepartments } from './org-departments'
import { orgLocations } from './org-locations'

export const teamInvitations = pgTable(
  'team_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    role: platformRoleEnum('role').default('staff'),
    invitationType: invitationTypeEnum('invitation_type')
      .notNull()
      .default('platform'),
    organizationId: uuid('organization_id').references(() => organizations.id),
    targetOrgRole: orgMemberRoleEnum('target_org_role'),
    status: invitationStatusEnum('status').notNull().default('pending'),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => users.id),
    token: text('token').unique().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    invitedFirstName: text('invited_first_name'),
    invitedLastName: text('invited_last_name'),
    invitedPosition: text('invited_position'),
    invitedDepartmentId: uuid('invited_department_id').references(() => orgDepartments.id),
    invitedLocationId: uuid('invited_location_id').references(() => orgLocations.id),
    tempPasswordHash: text('temp_password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_team_invitations_email').on(table.email),
    index('idx_team_invitations_status').on(table.status),
    index('idx_team_invitations_org_id').on(table.organizationId),
  ]
)
