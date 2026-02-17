import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import {
  formStatusEnum,
  formVisibilityEnum,
  formCompletionTypeEnum,
  formStepDisplayModeEnum,
} from './enums'
import { users } from './users'
import { organizations } from './organizations'
import { emailTemplates } from './email-templates'

export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  status: formStatusEnum('status').notNull().default('draft'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  visibility: formVisibilityEnum('visibility').notNull().default('assigned'),

  // Multi-step configuration
  stepDisplayMode: formStepDisplayModeEnum('step_display_mode')
    .notNull()
    .default('progress_bar'),

  // Completion configuration
  completionType: formCompletionTypeEnum('completion_type')
    .notNull()
    .default('thank_you'),
  completionTitle: text('completion_title'),
  completionMessage: text('completion_message'),
  completionRedirectUrl: text('completion_redirect_url'),
  sendConfirmationEmail: boolean('send_confirmation_email')
    .notNull()
    .default(false),
  confirmationEmailTemplateId: uuid('confirmation_email_template_id').references(
    () => emailTemplates.id
  ),

  // Versioning
  currentVersion: integer('current_version').notNull().default(1),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const formVersions = pgTable(
  'form_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    formId: uuid('form_id')
      .notNull()
      .references(() => forms.id),
    versionNumber: integer('version_number').notNull(),
    schema: jsonb('schema').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    publishedBy: uuid('published_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.formId, t.versionNumber),
    index('idx_form_versions_form_id').on(t.formId),
  ]
)

export const formOrganizationAssignments = pgTable(
  'form_organization_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    formId: uuid('form_id')
      .notNull()
      .references(() => forms.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    assignedBy: uuid('assigned_by')
      .notNull()
      .references(() => users.id),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.formId, t.organizationId),
    index('idx_form_org_assignments_form_id').on(t.formId),
    index('idx_form_org_assignments_org_id').on(t.organizationId),
  ]
)

export const formSubmissions = pgTable(
  'form_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    formId: uuid('form_id')
      .notNull()
      .references(() => forms.id),
    formVersionId: uuid('form_version_id')
      .notNull()
      .references(() => formVersions.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    submittedBy: uuid('submitted_by').references(() => users.id),
    data: jsonb('data').notNull(),
    metadata: jsonb('metadata'),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_form_submissions_form_id').on(table.formId),
    index('idx_form_submissions_org_id').on(table.organizationId),
    index('idx_form_submissions_submitted_at').on(table.submittedAt),
  ]
)
