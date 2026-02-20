import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { productStatusEnum } from './enums'
import { organizations } from './organizations'

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  status: productStatusEnum('status').notNull().default('active'),
  isDefault: boolean('is_default').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),

  // Seat limits
  maxOrgAdmins: integer('max_org_admins'),
  maxManagers: integer('max_managers'),
  maxMembers: integer('max_members'),

  // Feature limits
  maxAnalysesPerMonth: integer('max_analyses_per_month'),
  maxForms: integer('max_forms'),
  maxFormSubmissionsPerMonth: integer('max_form_submissions_per_month'),
  maxStorageMb: integer('max_storage_mb'),

  // Feature flags
  allowForms: boolean('allow_forms').notNull().default(true),
  allowApiAccess: boolean('allow_api_access').notNull().default(false),
  allowCustomBranding: boolean('allow_custom_branding').notNull().default(false),
  allowEmailTemplates: boolean('allow_email_templates').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const organizationProducts = pgTable(
  'organization_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),

    // Override columns for custom plans
    overrideMaxOrgAdmins: integer('override_max_org_admins'),
    overrideMaxManagers: integer('override_max_managers'),
    overrideMaxMembers: integer('override_max_members'),
    overrideMaxAnalysesPerMonth: integer('override_max_analyses_per_month'),
    overrideMaxForms: integer('override_max_forms'),
    overrideMaxFormSubmissionsPerMonth: integer('override_max_form_submissions_per_month'),
    overrideMaxStorageMb: integer('override_max_storage_mb'),

    // Feature flag overrides
    overrideAllowForms: boolean('override_allow_forms'),
    overrideAllowApiAccess: boolean('override_allow_api_access'),
    overrideAllowCustomBranding: boolean('override_allow_custom_branding'),
    overrideAllowEmailTemplates: boolean('override_allow_email_templates'),

    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    assignedBy: uuid('assigned_by'),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('organization_products_org_unique').on(table.organizationId),
    index('idx_org_products_product_id').on(table.productId),
  ]
)
