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

export const orgLocations = pgTable(
  'org_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    name: text('name').notNull(),
    address: text('address'),
    city: text('city'),
    country: text('country'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('org_locations_org_name_unique').on(
      table.organizationId,
      table.name
    ),
    index('idx_org_locations_org_id').on(table.organizationId),
  ]
)
