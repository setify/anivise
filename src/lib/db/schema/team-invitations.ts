import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import {
  platformRoleEnum,
  invitationStatusEnum,
  invitationTypeEnum,
  orgMemberRoleEnum,
} from './enums'
import { users } from './users'
import { organizations } from './organizations'

export const teamInvitations = pgTable('team_invitations', {
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
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
