# Changelog

## [0.18.0] - 2026-02-17
### Added
- Form Renderer component with two display modes: progress_bar (Typeform-style) and tabs (classic)
- 11 interactive field components: text, textarea, number, email, phone, date, radio, checkbox, CSAT (1-10 scale), rating (stars/hearts/thumbs), hidden
- Field wrapper component with label, description, required indicator, and animated error display
- Radio and checkbox fields support both default (list) and button (pill) display variants
- CSAT field with color gradient (red -> yellow -> green), hover effects, and configurable min/max labels
- Rating field with star/heart/thumb icons, hover fill preview, and bounce animation
- Conditional logic hook (`useConditionalFields`) evaluating show/hide rules in real-time
- Step-level validation with inline errors, scroll to first error, and per-field type checks
- Form completion component with animated checkmark (thank_you mode) or auto-redirect
- Dashboard forms page (`/forms`) showing cards of available forms with submission status
- Dashboard form fill page (`/forms/[slug]`) with access checks, submission, and already-submitted state
- Keyboard navigation: Enter advances to next step in progress_bar mode
- Form submission server action with org access check, server-side validation, metadata tracking (duration, user-agent)
- Admin submissions page (`/admin/forms/[formId]/submissions`) with stat cards, dynamic table, filters, detail dialog
- Dynamic table columns generated from form schema (field labels as headers)
- Submission filters: organization, date range, version
- Submission detail dialog with full field-by-field display and metadata
- CSV and XLSX export via API route (`/api/admin/forms/[formId]/submissions/export`)
- Export respects active filters, generates filename from form slug and date
- "View Submissions" action in admin forms list dropdown
- "Forms" nav item in dashboard sidebar (ClipboardList icon)
- Breadcrumb label for `submissions` segment
- i18n: `forms` namespace (dashboard renderer), `admin.forms.submissions` namespace (de + en)

### Dependencies
- Added xlsx for Excel export

## [0.17.0] - 2026-02-17
### Added
- Visual drag-and-drop Form Builder with @dnd-kit integration
- Form Builder three-column layout: field palette (left), canvas (center), settings (right)
- Field palette with 11 draggable field types in 4 categories (Text, Selection, Rating, Other)
- Builder canvas with sortable fields, dot-grid background, and multi-step navigation
- Step tabs with add/remove/rename and double-click editing
- Field settings panel with 5 tabs: General, Options (radio/checkbox), Validation, Logic, Hidden
- Conditional logic editor (show/hide with 7 operators, AND/OR logic)
- Builder toolbar with inline title editing, save status indicator, preview, and publish
- Form preview modal rendering all field types in read-only mode
- Auto-save with 3-second debounce (saves schema in-place, no version bump)
- Explicit "Save" creates new version; "Publish" sets form to published status
- Builder state management with useReducer (12 action types)
- Forms list page (`/admin/forms`) with data table: title, status badges, visibility, version, submissions, actions
- Form list actions: edit, duplicate, publish, archive, delete (draft only, with confirmation)
- New form page (`/admin/forms/new`) with metadata form: title, description, slug (auto-generated with availability check), display mode, visibility
- Form editor page (`/admin/forms/[formId]/edit`) loading form and current version schema
- "Formulare" nav item in admin sidebar (ClipboardList icon, after Organizations)
- Breadcrumb label for `forms` segment
- Form server actions: getForms, getFormById, getCurrentFormVersion, createForm, saveFormSchema, saveFormVersion, updateFormMeta, publishForm, archiveForm, duplicateForm, deleteForm, checkFormSlugAvailability
- Comprehensive i18n translations for `admin.forms` and `admin.forms.builder` namespaces (de + en, ~150 keys)

### Dependencies
- Added @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

## [0.16.0] - 2026-02-17
### Added
- Form Builder data model with 4 new database tables:
  - `forms`: multi-step form definitions with slug, visibility, completion config, versioning
  - `form_versions`: versioned JSON schema storage with publish tracking
  - `form_organization_assignments`: form-to-organization access control
  - `form_submissions`: submission data with form version reference and metadata
- 4 new PostgreSQL enums: `form_status`, `form_visibility`, `form_completion_type`, `form_step_display_mode`
- Complete TypeScript type system for JSON form schemas (`src/types/form-schema.ts`):
  - 11 field types (text, textarea, number, email, phone, date, radio, checkbox, csat, rating, hidden)
  - Type-specific config interfaces with discriminated union
  - Conditional logic (show/hide with 7 operators)
  - Field validation with pattern support
  - Multi-step form structure (FormSchema > FormStep > FormField)
- Zod validation schemas (`src/lib/validations/forms.ts`):
  - `formSchemaValidator` for complete form schema validation
  - `formFieldValidator` for individual field validation
  - `formMetaValidator` for form metadata (title, slug, visibility, completion config)
  - `createSubmissionValidator` dynamic validator generator from FormSchema
- Form helper functions (`src/lib/forms/index.ts`):
  - `getForm`, `getFormBySlug` for form retrieval
  - `getFormVersion` for version retrieval (specific or latest)
  - `canOrganizationAccessForm` for access control checks
  - `createFormVersion` for version creation with auto-increment
  - `publishForm` for publishing a form version
- Database types: Form, FormVersion, FormOrganizationAssignment, FormSubmission (Select + Insert)
- All new types exported from `src/types/index.ts`

## [0.15.0] - 2026-02-16
### Added
- Collapsible settings sub-navigation in admin sidebar (General, Email Layout, Email Templates)
- Secret caching with 5-minute TTL (`src/lib/crypto/secrets-cache.ts`) to avoid per-request DB+decryption
- Cache invalidation on secret save, rotate, and env import

### Changed
- Admin sidebar restructured: Team (superadmin only), collapsible Settings with sub-items, FlaskConical icon for Jobs
- All services now use `getCachedSecret()` with ENV fallback: n8n trigger, n8n callback, Resend email sending
- `sendTemplatedEmail` now reads Resend API key and from email from DB secrets with ENV fallback
- n8n webhook URL removed from platform settings (consolidated into integration secrets only)
- n8n hint text updated with auth header configuration instructions for both inbound and outbound
- Analysis settings tab: removed n8n webhook URL field, added note pointing to Integrations page
- Fixed lint error in admin-sidebar (function hoisting)

### Removed
- `analysis.n8n_webhook_url` from `PlatformSettings` interface (now in integration_secrets only)

## [0.14.0] - 2026-02-16
### Added
- Organization edit page (`/admin/organizations/[id]/edit`) with form sections:
  - Basic data (name, slug with live subdomain preview and availability check)
  - Subscription (tier and status selection with change warnings)
  - Limits & Settings (default language, max members, max analyses per month)
  - Internal notes (textarea with character count, superadmin-only)
- Extended organizations schema with `default_locale`, `max_members`, `max_analyses_per_month`, `internal_notes` columns
- `updateOrganization` server action with slug uniqueness/reserved word validation and audit logging
- `checkSlugAvailability` server action for real-time slug validation
- `updateOrganizationSchema` Zod validation schema
- "Edit" button on organization detail page (superadmin only)
- Breadcrumb label for `edit` segment
- i18n translations for `admin.orgs.edit` namespace (de + en, 23 keys)

## [0.13.2] - 2026-02-16
### Added
- "Send test email to me" button in email template editor (tests unsaved changes with [TEST] prefix)
- "Test" button on each template in the list view for quick test sends
- Full email layout preview in template editor (uses configured colors, logo, footer from email layout settings)
- Preview locale toggle (DE/EN) in template preview
- `sendTestTemplateEmail` server action with example variable rendering, layout wrapping, and audit logging
- `last_test_sent_at` column on `email_templates` table (updated on each test send)
- i18n translations for test send (sendTest, sendTestToMe, testSent, testError)

### Changed
- Email template preview now renders with full base layout (colors, logo, footer) instead of raw HTML
- Email templates page now receives and passes `layoutConfig` prop for accurate previews

## [0.13.1] - 2026-02-16
### Added
- Configurable email base layout page (`/admin/settings/email-layout`) with:
  - Logo URL and logo link configuration
  - Color customization (background, content area, primary/button, text, links)
  - Footer text with placeholders ({{platformName}}, {{currentYear}}, {{supportEmail}})
  - Border radius adjustment
  - Live email preview with desktop/mobile toggle
  - "Send Test Layout" button to email current layout to self
  - "Reset to Default" to restore original settings
- Email layout settings stored in `platform_settings` (11 new keys under `email.*`)
- `getEmailLayoutConfig()` helper to load layout config from DB
- `wrapInBaseLayout()` now uses configurable colors, logo, footer, and border radius
- Link to email layout from settings page (alongside email templates link)
- Audit logging for layout saves and test sends
- i18n translations for `admin.emailLayout` namespace (de + en)
- Breadcrumb label for `email-layout` segment

### Changed
- `wrapInBaseLayout()` refactored from hardcoded HTML to configurable template
- `sendTemplatedEmail()` now reads layout config from DB and uses platform name for sender
- `PlatformSettings` interface extended with 11 `email.*` keys

## [0.13.0] - 2026-02-16
### Added
- Integrations page (`/admin/integrations`) with encrypted secret management for:
  - **Supabase**: Project URL, Anon Key, Service Role Key with save, test connection, load from ENV
  - **Resend**: API Key, From Email, From Name with save, test connection, send test email, load from ENV
  - **n8n**: Webhook URL, Health URL, Auth Header Name/Value with save, test connection, secret rotation, load from ENV
  - **Vercel**: Read-only deployment info (environment, region, git branch, commit SHA, URL)
  - **Payment**: Disabled placeholder for future Stripe/Lemon Squeezy integration
- `integration_secrets` table with AES-256-GCM encryption (service, key, encrypted_value, iv, is_sensitive)
- `src/lib/crypto/secrets.ts` with encryption/decryption helpers (`getIntegrationSecret`, `setIntegrationSecret`, `getSecretMetadata`, `getMaskedSecret`)
- Integration server actions: `saveIntegrationSecrets`, `getIntegrationSecretsForUI`, `testSupabaseConnection`, `testResendConnection`, `testN8nConnection`, `sendTestEmail`, `rotateN8nSecret`, `loadFromEnv`, `getVercelInfo`
- "Integrations" nav item in admin sidebar (superadmin only, Link2 icon)
- StatusBadge component for connection status display (idle/testing/connected/error)
- `IntegrationSecret` and `NewIntegrationSecret` TypeScript types
- `SECRETS_ENCRYPTION_KEY` to `.env.example`
- i18n translations for integrations (`admin.integrations` namespace, de + en)

### Changed
- n8n trigger (`triggerN8nWebhook`) now reads webhook URL and auth from DB-stored integration secrets with ENV fallback
- n8n health check (`checkN8nHealth`) now reads webhook URL from DB-stored secrets with ENV fallback
- n8n callback handler now validates against DB-stored auth header name/value with ENV fallback
- Breadcrumbs component updated with `integrations` segment label

## [0.12.1] - 2026-02-16
### Added
- Breadcrumbs component for admin pages (auto-generated from URL path with segment labels)
- Staff permission filtering on admin sidebar (Settings only visible to superadmin)

### Changed
- Superadmin layout refactored from client-only to server+client architecture
  - Layout is now a server component that fetches user role via `requirePlatformRole`
  - Interactive parts (mobile sidebar, etc.) moved to `AdminLayoutClient` wrapper
  - `AdminSidebar` now receives `platformRole` prop for permission-based nav filtering
- Breadcrumbs visible in admin header on desktop (hidden on mobile)

## [0.12.0] - 2026-02-16
### Added
- n8n integration: webhook trigger helper (`triggerN8nWebhook`) and health check (`checkN8nHealth`)
- n8n callback webhook handler (`POST /api/webhooks/n8n/analysis-complete`) with secret validation, job update, report storage, and notifications
- Analysis Jobs page (`/admin/jobs`) with:
  - n8n connection health check card
  - 6 stat cards (total, pending, processing, completed, failed, cancelled)
  - Filterable table by status and organization
  - Retry action for failed/cancelled jobs
  - Cancel action with confirmation dialog for pending/processing jobs
  - Pagination
- "Analysis Jobs" nav item in admin sidebar (8 items now)
- Server actions: `getAnalysisJobs`, `getAnalysisJobStats`, `cancelAnalysisJob`, `retryAnalysisJob`, `checkN8nHealthAction`
- i18n translations for analysis jobs (`admin.jobs` namespace, de + en)

## [0.11.0] - 2026-02-16
### Added
- Notification center with `notifications` table (recipientId, type, title, body, link, isRead, metadata)
- `createNotification` helper with broadcast to all superadmins support
- `NotificationBell` component in admin header with popover, 30-second polling, unread badge
- Notifications page (`/admin/notifications`) with All/Unread tabs, "Mark all read" button, pagination
- "Notifications" nav item in admin sidebar with unread badge counter
- Notification server actions: `getRecentNotifications`, `getUnreadCount`, `getAllNotifications`, `markNotificationRead`, `markAllNotificationsRead`
- `Notification` and `NewNotification` TypeScript types
- i18n translations for notifications (`admin.notifications` namespace, de + en)
- `shadcn/ui` Popover component added
- Notifications integrated into org creation (notify all superadmins) and invitation acceptance (notify inviter)

## [0.10.0] - 2026-02-16
### Added
- Impersonation feature: Superadmins can "View as Organization" from org detail page
- Signed httpOnly impersonation cookie with HMAC verification and 2-hour timeout
- Impersonation banner in dashboard layout (amber, shows org name and role, "Back to Admin" button)
- `startImpersonationAction` and `endImpersonationAction` server actions with audit logging
- Confirmation dialog before starting impersonation
- i18n translations for impersonation (`admin.impersonation` namespace, de + en)

## [0.9.0] - 2026-02-16
### Added
- `email_templates` table with 5 system templates (team-invitation, org-invitation, welcome, password-reset, analysis-complete)
- Email send helper (`src/lib/email/send.ts`) with `sendTemplatedEmail` and `renderTemplatedEmail` functions
- Base email layout wrapper (header/footer) for all outgoing emails
- Email templates management page (`/admin/settings/emails`) with:
  - Template list with name, slug, description, type
  - Template editor with de/en tabs, subject and body fields
  - Available variables sidebar with click-to-copy
  - Live preview with example values
  - Reset to default for system templates
- `updateEmailTemplate` and `resetEmailTemplate` server actions with audit logging
- Link to email templates from settings page
- `resend` package installed for email sending
- `EmailTemplate` and `NewEmailTemplate` TypeScript types
- i18n translations for email templates (`admin.emailTemplates` namespace, de + en)

## [0.8.0] - 2026-02-16
### Added
- `platform_settings` table with key-value store for platform-wide configuration
- Settings helper (`src/lib/settings/platform.ts`) with typed `getSetting`/`setSetting`/`getAllSettings` functions and defaults
- Platform Settings page (`/admin/settings`) with 4 tabs:
  - General: Platform name, default language, default org tier
  - Invitations: Expiry days, max resends
  - Organizations: Reserved slugs (tag input), max trial members
  - Analysis: Max transcript size, n8n webhook URL
- "Settings" nav item added to admin sidebar (6 items now, only visible to superadmin)
- `updatePlatformSettings` server action with audit logging (`settings.updated`)
- `PlatformSetting` and `NewPlatformSetting` TypeScript types
- i18n translations for settings page (`admin.platformSettings` namespace, de + en)

### Changed
- Invitation expiry now reads from `platform_settings` instead of hardcoded 7 days
- Org creation now checks reserved slugs from `platform_settings` before slug uniqueness check

## [0.7.0] - 2026-02-16
### Added
- Audit trail / activity log system with `audit_logs` table (append-only, indexed on `created_at` and `action`)
- `logAudit()` helper function with `AuditAction` type (20 action types across org, team, invitation, profile, settings, impersonation, analysis_job)
- Audit logging integrated into all admin mutation actions (updateProfile, inviteTeamMember, updateTeamMemberRole, removeTeamMember, cancelInvitation, createOrganization, deleteOrganization, createOrganizationWithAdmin, resendOrgInvitation, cancelOrgInvitation)
- `getAuditLogs` server action with category prefix filtering, time period filtering (24h/7d/30d), and pagination
- Activity page (`/admin/activity`) with filterable log table, color-coded action icons, relative timestamps, metadata display, and pagination
- "Activity" nav item added to admin sidebar (5 items now: Dashboard, Profile, Team, Organizations, Activity)
- `AuditLog` and `NewAuditLog` TypeScript types in `src/types/database.ts`
- `date-fns` dependency for relative time formatting with locale support (de/en)
- i18n translations for activity page (`admin.activity` namespace, de + en)

## [0.6.1] - 2026-02-16
### Added
- Org creation form now includes "First Org-Admin" section (email, first name, last name)
- `createOrganizationWithAdmin` server action: creates org + org-admin invitation in one step
- Org-admin invitation generates token and shows invite link in dialog (since Resend not yet configured)
- Org detail page now has "Invitations" tab showing all invitations for that organization
- Resend invitation: cancels old token, creates new one, shows new link
- Cancel invitation from org detail page
- `getOrgInvitations`, `resendOrgInvitation`, `cancelOrgInvitation` server actions
- Email templates (React components): `org-invitation.tsx` and `team-invitation.tsx` for future Resend integration
- i18n translations for org creation admin section (`admin.orgs.create`) and org invitations (`admin.orgs.invitations`)

## [0.6.0] - 2026-02-16
### Added
- Reusable `StatCard` component (`src/components/admin/stat-card.tsx`) with icon, value, description, and trend support
- Admin dashboard expanded with 6 placeholder stat cards (Organizations, Active Users, Running Analyses, New Signups, Open Invitations, Failed Jobs)
- `invitation_type` enum (`platform` | `organization`) for distinguishing platform vs org invitations
- Extended `team_invitations` table with `invitation_type`, `organization_id`, and `target_org_role` columns
- Invitation acceptance page (`/[locale]/invite/[token]`) with full flow:
  - Token validation (expired, used, cancelled, not found states)
  - Logged-in users: accept invitation with one click
  - New users: register account and accept in one flow
  - Existing users not logged in: redirect to login then back to invitation
- Server actions for invitation validation, acceptance, and registration+acceptance
- Invite route added to public middleware patterns (no auth required)
- Comprehensive i18n translations for invitation flow (`auth.invite` namespace, de + en)
- New dashboard stat translations (`admin.stats` namespace): activeUsers, runningAnalyses, newSignups, openInvitations, failedJobs, placeholder

### Changed
- `team_invitations.role` column is now nullable (null for organization invitations)
- `getPendingInvitations` action now filters to platform invitations only
- `inviteTeamMember` action explicitly sets `invitationType: 'platform'`
- Team page invitation interface updated to handle nullable role

## [0.5.0] - 2026-02-16
### Added
- Superadmin Profile page (`/admin/profile`) with editable form (first name, last name, display name, phone, timezone, locale)
- Superadmin Team management page (`/admin/team`) with members table, role management, invite dialog, and pending invitations tab
- Superadmin Organizations page (`/admin/organizations`) with list view, create form, and detail page with danger zone (soft-delete)
- `platform_role` enum (`superadmin` | `staff`) replacing the `is_superadmin` boolean on users table
- `invitation_status` enum for team invitations
- `team_invitations` table for platform team invitations with token, expiry, and status tracking
- Extended users table with `first_name`, `last_name`, `display_name`, `phone`, `timezone`, `avatar_storage_path`, `platform_role` columns
- `require-platform-role` server-side helper for enforcing platform role access in server components and actions
- `hasPlatformRole()` and `getPlatformRoleLevel()` role helpers
- `canManagePlatformTeam()` permission helper (superadmin only)
- Zod validation schemas for admin forms (`updateProfile`, `inviteTeamMember`, `updateTeamMemberRole`, `removeTeamMember`, `createOrganization`, `deleteOrganization`)
- Server actions for profile update, team management (invite, role change, remove, cancel invitation), and organization CRUD
- Platform stats (real counts from DB) on admin dashboard
- Comprehensive i18n translations for admin profile, team, and organizations (de + en)
- Additional shadcn/ui components: table, textarea, tabs, alert-dialog, skeleton, switch

### Changed
- Admin sidebar now has 4 nav items: Dashboard, Profile, Team, Organizations
- `canAccessSuperadmin()` now accepts `PlatformRole | null` instead of `boolean`
- `useRole` hook returns `platformRole` instead of `isSuperadmin`
- RBAC roles module extended with `PlatformRole` type, `PLATFORM_ROLES` constant, and validation helpers
- Admin dashboard page fetches real stats from database

### Removed
- `is_superadmin` boolean column from users table (replaced by `platform_role` enum)

## [0.4.0] - 2026-02-16
### Added
- Dashboard app shell with responsive sidebar navigation (desktop fixed, mobile via Sheet)
- Header component with mobile menu toggle, dark mode toggle, and user avatar dropdown
- Admin sidebar for superadmin layout with organization management navigation
- ThemeProvider using next-themes with light/dark/system mode support
- ThemeToggle component with dropdown menu for theme selection
- Dashboard page with stats cards (analyses, active jobs, reports, team members)
- Analyses page with empty state and new analysis action
- Team page with empty state and invite action
- Settings page with profile, organization, and notifications sections
- Superadmin admin page with platform stats and organization management placeholder
- Root page redirects to dashboard
- Comprehensive i18n translations (de + en) for all navigation, pages, theme, and admin labels
- Uses product terminology (Muster/Patterns, Handlungsoptionen/Action Options)

### Changed
- Root layout now includes ThemeProvider for dark mode support
- Dashboard layout wraps pages with AppShell (sidebar + header)
- Superadmin layout includes AdminSidebar with admin-specific navigation
- Locale root page now redirects to dashboard instead of showing welcome text
- Translation namespace changed from "navigation" to "nav" for consistency

## [0.3.0] - 2026-02-16
### Added
- Next.js middleware with three-layer architecture: locale detection (next-intl), subdomain resolution, and auth check (Supabase)
- RBAC system with role definitions (superadmin, org_admin, manager, member) and hierarchy helpers
- Permission helpers (canManageOrganization, canRequestAnalysis, canViewReport, canManageTeam, canAccessSuperadmin)
- Role permissions map for client-side UX checks
- Login page with email/password form, magic link support, and OAuth placeholders (Google, Microsoft - coming soon)
- Register page with name, email, password form
- Auth layout with centered card design and app branding
- Auth callback API route for magic link and OAuth code exchange
- next-intl navigation helpers (Link, useRouter, usePathname, redirect, getPathname)
- Client-side hooks: useTenant (organization context) and useRole (current user role)
- Auth-related translations (de + en): login descriptions, magic link messages, SSO labels, error messages
- Error translations namespace (unauthorized, forbidden, notFound)
- Middleware handles localhost development gracefully (no subdomains, optional query param/header fallback)
- Unauthenticated users on protected routes are redirected to login with redirectTo parameter

### Changed
- Middleware rewritten from simple next-intl wrapper to full three-concern architecture
- Auth pages upgraded from placeholder text to functional forms with Supabase integration

## [0.2.0] - 2026-02-16
### Added
- Drizzle ORM with PostgreSQL (postgres.js driver) configured
- drizzle.config.ts with schema path and migrations output
- All database enums: subscription_tier, subscription_status, org_member_role, consent_type, consent_status, job_status, locale
- Schema: organizations table with slug, subscription tier/status, soft-delete
- Schema: users table with Supabase Auth ID integration, superadmin flag, locale preference
- Schema: organization_members junction table with role enum and unique constraint (org + user)
- Schema: analysis_subjects table with organization_id tenant isolation
- Schema: consents table with consent_type, status, granted_at tracking
- Schema: analysis_jobs table with full job lifecycle (status enum, n8n timestamps, error tracking)
- Schema: reports table with jsonb report_data, unique analysis_job_id, subject viewing tracking
- Schema index re-exporting all enums and tables
- Drizzle DB client instance (src/lib/db/index.ts)
- Supabase browser client (src/lib/supabase/client.ts) using @supabase/ssr
- Supabase server client (src/lib/supabase/server.ts) with cookie handling
- Supabase admin client (src/lib/supabase/admin.ts) with service role key for superadmin ops
- Supabase middleware helper (src/lib/supabase/middleware.ts) for auth session refresh
- TypeScript inferred types for all tables (InferSelectModel, InferInsertModel)
- Type re-exports from src/types/index.ts
- RLS SQL migration: enable RLS on all tables (001_enable_rls.sql)
- RLS SQL migration: tenant isolation policies for all tenant tables (002_tenant_isolation_policies.sql)
- DATABASE_URL to .env.example

## [0.1.0] - 2026-02-16
### Added
- Initial project scaffold with Next.js 16 App Router and TypeScript (strict mode)
- Tailwind CSS v4 + shadcn/ui configured with commonly used components (button, card, input, label, dropdown-menu, sheet, separator, avatar, badge, dialog, form, select, sonner, tooltip)
- next-intl with German (de) and English (en) base translations
- next-themes for dark mode support
- zod for runtime validation
- Complete folder structure per CLAUDE.md specification
- Locale-based routing with [locale] dynamic segment
- Placeholder pages for all route groups: (auth), (dashboard), (superadmin)
- Root layout, locale layout with NextIntlClientProvider
- Basic middleware with next-intl locale routing
- API types with consistent response shapes
- .env.example with all required environment variables
- Project documentation (README.md, CHANGELOG.md, PROJECT_STATE.md)
