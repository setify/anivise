import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { guideCategories } from './guide-categories'
import { users } from './users'
import { mediaFiles } from './media-files'

export const guides = pgTable(
  'guides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    categoryId: uuid('category_id').references(() => guideCategories.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon').notNull().default('FileText'),
    storagePath: text('storage_path').notNull(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    mediaFileId: uuid('media_file_id').references(() => mediaFiles.id),
    accessManagers: boolean('access_managers').notNull().default(true),
    accessEmployees: boolean('access_employees').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_guides_org_id').on(table.organizationId),
    index('idx_guides_category_id').on(table.categoryId),
    index('idx_guides_org_category').on(table.organizationId, table.categoryId),
  ]
)
