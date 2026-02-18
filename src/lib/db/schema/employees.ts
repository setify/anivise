import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { employeeStatusEnum } from './enums'
import { organizations } from './organizations'
import { orgDepartments } from './org-departments'
import { orgLocations } from './org-locations'
import { organizationMembers } from './organization-members'
import { users } from './users'

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    position: text('position'),
    avatarUrl: text('avatar_url'),
    avatarStoragePath: text('avatar_storage_path'),
    departmentId: uuid('department_id').references(() => orgDepartments.id),
    locationId: uuid('location_id').references(() => orgLocations.id),
    managerId: uuid('manager_id').references(() => organizationMembers.id),
    status: employeeStatusEnum('status').notNull().default('active'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_employees_org_id').on(table.organizationId),
    index('idx_employees_status').on(table.status),
    index('idx_employees_department_id').on(table.departmentId),
    index('idx_employees_location_id').on(table.locationId),
    index('idx_employees_manager_id').on(table.managerId),
  ]
)
