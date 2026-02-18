import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const orgDepartments = pgTable(
  'org_departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('org_departments_org_name_unique').on(
      table.organizationId,
      table.name
    ),
    index('idx_org_departments_org_id').on(table.organizationId),
  ]
)
