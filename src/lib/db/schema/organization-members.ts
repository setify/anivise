import {
  pgTable,
  uuid,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { orgMemberRoleEnum } from './enums'
import { organizations } from './organizations'
import { users } from './users'

export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: orgMemberRoleEnum('role').notNull().default('member'),
    invitedBy: uuid('invited_by').references(() => users.id),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('organization_members_org_user_unique').on(
      table.organizationId,
      table.userId
    ),
    index('idx_org_members_org_id').on(table.organizationId),
    index('idx_org_members_user_id').on(table.userId),
    index('idx_org_members_role').on(table.role),
  ]
)
