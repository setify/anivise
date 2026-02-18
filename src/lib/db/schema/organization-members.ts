import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { orgMemberRoleEnum } from './enums'
import { organizations } from './organizations'
import { users } from './users'
import { orgDepartments } from './org-departments'
import { orgLocations } from './org-locations'

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
    position: text('position'),
    departmentId: uuid('department_id').references(() => orgDepartments.id),
    locationId: uuid('location_id').references(() => orgLocations.id),
    phone: text('phone'),
    status: text('status').notNull().default('active'),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedBy: uuid('deactivated_by').references(() => users.id),
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
    index('idx_org_members_status').on(table.status),
  ]
)
