import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { mediaContextEnum } from './enums'
import { users } from './users'

export const mediaFiles = pgTable(
  'media_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bucket: text('bucket').notNull(),
    path: text('path').notNull(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    context: mediaContextEnum('context').notNull().default('general'),
    contextEntityId: text('context_entity_id'),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id),
    altText: text('alt_text'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('idx_media_files_bucket_path').on(t.bucket, t.path),
    index('idx_media_files_context').on(t.context),
    index('idx_media_files_uploaded_by').on(t.uploadedBy),
  ]
)
