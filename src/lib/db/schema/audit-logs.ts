import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'
import { organizations } from './organizations'

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  organizationId: uuid('organization_id').references(() => organizations.id),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
