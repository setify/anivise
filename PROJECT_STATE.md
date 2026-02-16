# Project State

**Version:** 0.4.0
**Last Updated:** 2026-02-16
**Last Commit:** feat(ui): add dashboard layouts, navigation and i18n setup v0.4.0

## What's Implemented

### Infrastructure
- [x] Next.js 16 App Router with TypeScript strict mode
- [x] Tailwind CSS v4 + shadcn/ui configured
- [x] next-intl with de/en comprehensive translations
- [x] next-themes with ThemeProvider (dark mode fully functional)
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
- [x] Supabase Auth integration (email/password + magic link)
- [x] Login page with email/password form, magic link, OAuth placeholders
- [x] Register page with name, email, password form
- [x] Auth layout with centered card design
- [x] Auth callback API route (magic link + OAuth code exchange)
- [x] Middleware: auth check (protected route redirect to login)
- [x] Middleware: subdomain to org resolution (production subdomains + dev fallback)
- [x] Middleware: locale detection via next-intl
- [x] next-intl navigation helpers (Link, useRouter, usePathname, redirect)
- [ ] OAuth (Google/Microsoft) - placeholders only
- [ ] SSO/SAML - not started

### RBAC
- [x] Role definitions (superadmin, org_admin, manager, member) with hierarchy
- [x] Permission helper functions (canManageOrganization, canRequestAnalysis, canViewReport, canManageTeam, canAccessSuperadmin)
- [x] Role permissions map for client-side UX checks
- [x] Role-based middleware guards (auth redirect for protected routes)
- [ ] UI-level permission checks in components (hooks available, not yet wired)

### Hooks
- [x] useTenant - client-side organization context (subdomain or dev query param)
- [x] useRole - client-side user role in current org (UX only, not security)

### UI / Pages
- [x] Root layout with fonts, metadata, and ThemeProvider
- [x] Locale layout with NextIntlClientProvider
- [x] Auth layout + placeholder pages (login, register)
- [x] Dashboard app shell (sidebar + header)
- [x] Responsive sidebar (desktop fixed, mobile Sheet)
- [x] Header with mobile menu, dark mode toggle, user dropdown
- [x] Dark mode toggle component (light/dark/system)
- [x] Dashboard page with stats cards and activity section
- [x] Analyses page with empty state
- [x] Team page with empty state
- [x] Settings page with profile/org/notifications sections
- [x] Superadmin layout with admin sidebar
- [x] Superadmin admin page with platform stats
- [x] Home page (redirects to dashboard)
- [ ] Analysis upload flow
- [ ] Report viewer

### Integrations
- [ ] n8n webhook trigger
- [ ] n8n callback handler
- [ ] Resend email
- [ ] Supabase Storage upload flow

## What's NOT Implemented Yet
- Analysis upload + job creation flow
- n8n integration (webhook trigger + callback)
- Report generation + viewer
- Resend email (magic link, notifications)
- Supabase Storage file upload with RLS
- OAuth providers (Google, Microsoft)
- SSO/SAML for Enterprise
- Team management UI (functional, currently placeholder)
- Organization settings UI (functional, currently placeholder)
- Superadmin org management (functional, currently placeholder)
- Consent management UI
- User invitation flow
- Testing (Vitest, Playwright)

## Known Issues / Tech Debt
- Sidebar user section shows hardcoded placeholder ("User") - needs wiring to auth session
- Sidebar organization label is placeholder - useTenant hook available but not yet wired
- All stats show "0" as static values until connected to database queries
- RLS policies are defined as SQL files but not yet applied to a live Supabase instance
- DATABASE_URL env var needed for Drizzle (added to .env.example)
- Next.js 16 shows deprecation warning for middleware convention (will be renamed to "proxy" in future)
- useRole hook queries Supabase directly from client - consider server-side session enrichment for performance

## File Map (Key Files)
- `src/app/layout.tsx` - Root layout with fonts, metadata, ThemeProvider
- `src/app/[locale]/layout.tsx` - Locale layout with NextIntlClientProvider
- `src/app/[locale]/page.tsx` - Redirects to dashboard
- `src/app/[locale]/(dashboard)/layout.tsx` - Dashboard layout with AppShell
- `src/app/[locale]/(superadmin)/layout.tsx` - Admin layout with AdminSidebar
- `src/components/layout/app-shell.tsx` - Main wrapper (sidebar + header + content)
- `src/components/layout/sidebar.tsx` - Navigation sidebar with nav links
- `src/components/layout/header.tsx` - Top bar with menu toggle, theme, user menu
- `src/components/layout/admin-sidebar.tsx` - Superadmin navigation sidebar
- `src/components/shared/theme-provider.tsx` - next-themes ThemeProvider wrapper
- `src/components/shared/theme-toggle.tsx` - Dark mode toggle dropdown
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
- `src/middleware.ts` - Three-layer middleware (locale + subdomain + auth)
- `src/lib/auth/roles.ts` - RBAC role definitions and hierarchy helpers
- `src/lib/auth/permissions.ts` - Permission check functions and role permissions map
- `src/lib/i18n/request.ts` - next-intl server request config
- `src/lib/i18n/routing.ts` - Locale routing definition
- `src/lib/i18n/navigation.ts` - next-intl navigation helpers (Link, useRouter, etc.)
- `src/app/[locale]/(auth)/layout.tsx` - Auth layout (centered card)
- `src/app/[locale]/(auth)/login/page.tsx` - Login page with Supabase auth
- `src/app/[locale]/(auth)/register/page.tsx` - Register page with Supabase auth
- `src/app/api/auth/callback/route.ts` - Auth callback for magic link/OAuth
- `src/hooks/use-tenant.ts` - Client-side organization context hook
- `src/hooks/use-role.ts` - Client-side user role hook
- `src/lib/constants.ts` - App constants
- `src/lib/utils.ts` - cn() utility
- `src/messages/de.json` / `en.json` - Comprehensive translation files
- `.env.example` - Environment variable template
