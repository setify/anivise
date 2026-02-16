# Project State

**Version:** 0.2.0
**Last Updated:** 2026-02-16
**Last Commit:** feat(db): add complete database schema and Supabase clients v0.2.0

## What's Implemented

### Infrastructure
- [x] Next.js 16 App Router with TypeScript strict mode
- [x] Tailwind CSS v4 + shadcn/ui configured
- [x] next-intl with de/en base translations
- [x] next-themes installed (dark mode ready)
- [x] zod installed for runtime validation
- [x] pnpm as package manager
- [x] ESLint configured
- [x] Complete folder structure from CLAUDE.md

### Database
- [x] Drizzle ORM configured with PostgreSQL (postgres.js driver)
- [x] drizzle.config.ts with schema path and migrations output
- [x] All enums defined (subscription_tier, subscription_status, org_member_role, consent_type, consent_status, job_status, locale)
- [x] Schema: organizations (name, slug, settings, subscription tier/status, soft-delete)
- [x] Schema: users (Supabase Auth ID, email, superadmin flag, locale preference)
- [x] Schema: organization_members (junction table, role enum, unique constraint)
- [x] Schema: analysis_subjects (full_name, email, role_title, organization_id)
- [x] Schema: consents (consent_type, status, granted_at, revoked_at, ip_address)
- [x] Schema: analysis_jobs (status lifecycle, n8n timestamps, transcript path, error tracking)
- [x] Schema: reports (jsonb report_data, unique analysis_job_id, subject viewing)
- [x] Drizzle DB client instance
- [x] TypeScript inferred types (Select + Insert for all tables)
- [x] Supabase browser client (@supabase/ssr)
- [x] Supabase server client (cookie-based auth)
- [x] Supabase admin client (service role, superadmin only)
- [x] Supabase middleware helper (session refresh)
- [x] RLS SQL templates (enable RLS + tenant isolation policies)
- [ ] RLS policies applied to Supabase (requires running migrations against live DB)

### Authentication
- [ ] Supabase Auth integration
- [ ] Login page (email/password + magic link)
- [ ] Register page
- [ ] Middleware: auth check
- [ ] Middleware: subdomain to org resolution
- [ ] OAuth (Google/Microsoft)
- [ ] SSO/SAML

### RBAC
- [ ] Role definitions (superadmin, org_admin, manager, member)
- [ ] Permission helper functions
- [ ] Role-based middleware guards
- [ ] UI-level permission checks in components

### UI / Pages
- [x] Root layout with fonts and metadata
- [x] Locale layout with NextIntlClientProvider
- [x] Auth layout + placeholder pages (login, register)
- [x] Dashboard layout + placeholder pages (dashboard, analyses, team, settings)
- [x] Superadmin layout + placeholder page (admin)
- [x] Home page (locale root)
- [ ] Dashboard sidebar and header
- [ ] Dark mode toggle component
- [ ] Analysis upload flow
- [ ] Report viewer

### Integrations
- [ ] n8n webhook trigger
- [ ] n8n callback handler
- [ ] Resend email
- [ ] Supabase Storage upload flow

## What's NOT Implemented Yet
- Authentication flows (login, register, magic link)
- Middleware (subdomain resolution, auth check)
- RBAC (role definitions, permission checks)
- Dashboard UI (sidebar, header, navigation)
- Dark mode toggle
- Analysis upload + job creation flow
- n8n integration (webhook trigger + callback)
- Report generation + viewer
- Resend email (magic link, notifications)
- Supabase Storage file upload with RLS
- OAuth providers (Google, Microsoft)
- SSO/SAML for Enterprise
- Team management UI
- Organization settings UI
- Superadmin org management
- Consent management UI
- User invitation flow
- Testing (Vitest, Playwright)

## Known Issues / Tech Debt
- next-themes is installed but ThemeProvider is not yet wired into layouts (will be added in v0.4.0)
- RLS policies are defined as SQL files but not yet applied to a live Supabase instance
- DATABASE_URL env var needed for Drizzle (added to .env.example)

## File Map (Key Files)
- `drizzle.config.ts` - Drizzle Kit configuration
- `src/lib/db/schema/enums.ts` - All PostgreSQL enums
- `src/lib/db/schema/organizations.ts` - Organizations table
- `src/lib/db/schema/users.ts` - Users table
- `src/lib/db/schema/organization-members.ts` - Org members junction table
- `src/lib/db/schema/analysis-subjects.ts` - Analysis subjects table
- `src/lib/db/schema/consents.ts` - Consents table
- `src/lib/db/schema/analysis-jobs.ts` - Analysis jobs table
- `src/lib/db/schema/reports.ts` - Reports table
- `src/lib/db/schema/index.ts` - Schema re-exports
- `src/lib/db/index.ts` - Drizzle client instance
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/supabase/admin.ts` - Service-role client (superadmin)
- `src/lib/supabase/middleware.ts` - Auth middleware helper
- `src/types/database.ts` - Drizzle inferred types
- `src/types/index.ts` - Type re-exports
- `supabase/migrations/001_enable_rls.sql` - Enable RLS on all tables
- `supabase/migrations/002_tenant_isolation_policies.sql` - Tenant isolation policies
- `src/app/layout.tsx` - Root layout with fonts and metadata
- `src/app/[locale]/layout.tsx` - Locale layout with NextIntlClientProvider
- `src/middleware.ts` - next-intl locale routing (will be extended with auth + subdomain)
- `src/lib/i18n/request.ts` - next-intl server request config
- `src/lib/i18n/routing.ts` - Locale routing definition
- `src/lib/constants.ts` - App constants
- `src/lib/utils.ts` - cn() utility
- `src/messages/de.json` / `en.json` - Translation files
- `.env.example` - Environment variable template
