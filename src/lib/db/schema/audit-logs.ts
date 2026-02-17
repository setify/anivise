import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { organizations } from './organizations'

export const auditLogs = pgTable(
  'audit_logs',
  {
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
  },
  (table) => [
    index('idx_audit_logs_actor_id').on(table.actorId),
    index('idx_audit_logs_action').on(table.action),
    index('idx_audit_logs_org_id').on(table.organizationId),
    index('idx_audit_logs_created_at').on(table.createdAt),
  ]
)
