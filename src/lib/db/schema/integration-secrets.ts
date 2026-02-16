import { pgTable, uuid, text, boolean, timestamp, unique } from 'drizzle-orm/pg-core'
import { users } from './users'

export const integrationSecrets = pgTable(
  'integration_secrets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    service: text('service').notNull(),
    key: text('key').notNull(),
    encryptedValue: text('encrypted_value').notNull(),
    iv: text('iv').notNull(),
    isSensitive: boolean('is_sensitive').notNull().default(true),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique('uq_service_key').on(table.service, table.key)]
)
