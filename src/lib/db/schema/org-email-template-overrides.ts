import { pgTable, uuid, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const orgEmailTemplateOverrides = pgTable(
  'org_email_template_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    templateSlug: text('template_slug').notNull(),
    subjectDe: text('subject_de').notNull(),
    subjectEn: text('subject_en').notNull(),
    bodyDe: text('body_de').notNull(),
    bodyEn: text('body_en').notNull(),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('org_email_tpl_override_org_slug_idx').on(
      table.organizationId,
      table.templateSlug
    ),
    index('org_email_tpl_override_org_idx').on(table.organizationId),
  ]
)
