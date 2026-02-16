# Changelog

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
