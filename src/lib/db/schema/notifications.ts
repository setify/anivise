import { pgTable, uuid, text, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => users.id),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'),
    isRead: boolean('is_read').notNull().default(false),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_notifications_recipient_id').on(table.recipientId),
    index('idx_notifications_is_read').on(table.isRead),
    index('idx_notifications_created_at').on(table.createdAt),
  ]
)
