import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { platformRoleEnum, invitationStatusEnum } from './enums'
import { users } from './users'

export const teamInvitations = pgTable('team_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  role: platformRoleEnum('role').notNull().default('staff'),
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
