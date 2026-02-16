# Project State

**Version:** 0.7.0
**Last Updated:** 2026-02-16
**Last Commit:** feat(admin): add audit trail and activity log page

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
- [x] All enums defined (subscription_tier, subscription_status, org_member_role, consent_type, consent_status, job_status, locale, platform_role, invitation_status, invitation_type)
- [x] Schema: organizations (name, slug, settings, subscription tier/status, soft-delete)
- [x] Schema: users (Supabase Auth ID, email, first/last/display name, phone, timezone, avatar, platform_role, locale)
- [x] Schema: organization_members (junction table, role enum, unique constraint)
- [x] Schema: analysis_subjects (full_name, email, role_title, organization_id)
- [x] Schema: consents (consent_type, status, granted_at, revoked_at, ip_address)
- [x] Schema: analysis_jobs (status lifecycle, n8n timestamps, transcript path, error tracking)
- [x] Schema: reports (jsonb report_data, unique analysis_job_id, subject viewing)
- [x] Schema: team_invitations (email, role, status, token, expiry, invitation_type, organization_id, target_org_role)
- [x] Schema: audit_logs (append-only, actor, action, entity, metadata, IP, indexed)
- [x] Drizzle DB client instance
- [x] TypeScript inferred types (Select + Insert for all tables including team_invitations, audit_logs)
- [x] Supabase browser client (@supabase/ssr)
- [x] Supabase server client (cookie-based auth)
- [x] Supabase admin client (service role, superadmin only)
- [x] Supabase middleware helper (session refresh)
- [x] RLS SQL templates (enable RLS + tenant isolation policies)
- [x] Schema pushed to live Supabase database
- [ ] RLS policies applied to Supabase (requires running SQL migrations against live DB)

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
- [x] Platform role definitions (superadmin, staff) with hierarchy
- [x] Permission helper functions (canManageOrganization, canRequestAnalysis, canViewReport, canManageTeam, canAccessSuperadmin, canManagePlatformTeam)
- [x] Role permissions map for client-side UX checks
- [x] Role-based middleware guards (auth redirect for protected routes)
- [x] requirePlatformRole server-side guard for admin pages
- [ ] UI-level permission checks in dashboard components (hooks available, not yet wired)

### Hooks
- [x] useTenant - client-side organization context (subdomain or dev query param)
- [x] useRole - client-side user role in current org + platform role (UX only, not security)

### Validations
- [x] Zod schemas for admin forms (profile update, team invite/update/remove, org create/delete)

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
- [x] Superadmin layout with admin sidebar (5 nav items: Dashboard, Profile, Team, Organizations, Activity)
- [x] Superadmin dashboard page with 6 placeholder stat cards (StatCard component)
- [x] Reusable StatCard component (`src/components/admin/stat-card.tsx`)
- [x] Superadmin Profile page with editable form
- [x] Superadmin Team management page (members table, invite dialog, role change, remove, invitations tab)
- [x] Superadmin Organizations list page with table
- [x] Superadmin Create Organization page with form
- [x] Superadmin Organization detail page with danger zone (soft-delete) and invitations tab
- [x] Org creation form with "First Org-Admin" section and auto-invitation
- [x] Superadmin Activity page with audit log table, action/period filters, pagination
- [x] Home page (redirects to dashboard)
- [x] Invitation acceptance page (`/invite/[token]`) with token validation, register, and accept flows
- [ ] Analysis upload flow
- [ ] Report viewer

### Server Actions
- [x] updateProfile - update current user's profile fields
- [x] getTeamMembers - list platform team members
- [x] getPendingInvitations - list pending team invitations
- [x] inviteTeamMember - invite new platform team member (or promote existing user)
- [x] updateTeamMemberRole - change a team member's platform role
- [x] removeTeamMember - revoke platform role from a team member
- [x] cancelInvitation - cancel a pending team invitation
- [x] getOrganizations - list all organizations
- [x] getOrganizationById - get single organization details
- [x] createOrganization - create new organization with slug uniqueness check
- [x] deleteOrganization - soft-delete an organization
- [x] getPlatformStats - get platform-wide stats (org count, user count)
- [x] validateInviteToken - validate invitation token and return invitation info
- [x] acceptInvitation - accept invitation for logged-in users (platform role or org membership)
- [x] registerAndAcceptInvitation - register new account and accept invitation in one step
- [x] createOrganizationWithAdmin - create org and org-admin invitation in one step
- [x] getOrgInvitations - list invitations for a specific organization
- [x] resendOrgInvitation - cancel old invitation and create new one
- [x] cancelOrgInvitation - cancel an org invitation
- [x] logAudit - append audit log entry (20 action types)
- [x] getAuditLogs - list audit logs with action/period filters and pagination

### Integrations
- [ ] n8n webhook trigger
- [ ] n8n callback handler
- [ ] Resend email
- [ ] Supabase Storage upload flow

## What's NOT Implemented Yet
- Analysis upload + job creation flow
- n8n integration (webhook trigger + callback)
- Report generation + viewer
- Resend email (magic link, notifications, team invitations)
- Supabase Storage file upload with RLS
- OAuth providers (Google, Microsoft)
- SSO/SAML for Enterprise
- Team management UI for organizations (functional, currently placeholder)
- Organization settings UI (functional, currently placeholder)
- Consent management UI
- User invitation flow (for org-level)
- Testing (Vitest, Playwright)
- Avatar upload in profile page
- Email templates created (React components) but Resend not yet integrated
- Team invitation email sending (invitations created but email not sent)
- Invitation acceptance page needs email notifications when invitation is accepted

## Known Issues / Tech Debt
- Sidebar user section shows hardcoded placeholder ("User") - needs wiring to auth session
- Sidebar organization label is placeholder - useTenant hook available but not yet wired
- Dashboard stats show "0" as static values until connected to database queries
- RLS policies are defined as SQL files but not yet applied to a live Supabase instance
- Next.js 16 shows deprecation warning for middleware convention (will be renamed to "proxy" in future)
- useRole hook queries Supabase directly from client - consider server-side session enrichment for performance
- Profile form uses toast in render (should use useEffect for toast side effects)
- Team invitations don't send actual emails yet (Resend not integrated)

## File Map (Key Files)
- `src/app/layout.tsx` - Root layout with fonts, metadata, ThemeProvider
- `src/app/[locale]/layout.tsx` - Locale layout with NextIntlClientProvider
- `src/app/[locale]/page.tsx` - Redirects to dashboard
- `src/app/[locale]/(dashboard)/layout.tsx` - Dashboard layout with AppShell
- `src/app/[locale]/(superadmin)/layout.tsx` - Admin layout with AdminSidebar
- `src/app/[locale]/(superadmin)/admin/page.tsx` - Admin dashboard with real stats
- `src/app/[locale]/(superadmin)/admin/actions.ts` - All admin server actions
- `src/app/[locale]/(superadmin)/admin/profile/page.tsx` - Profile page (server)
- `src/app/[locale]/(superadmin)/admin/profile/profile-form.tsx` - Profile form (client)
- `src/app/[locale]/(superadmin)/admin/team/page.tsx` - Team page (server)
- `src/app/[locale]/(superadmin)/admin/team/team-page-client.tsx` - Team management (client)
- `src/app/[locale]/(superadmin)/admin/organizations/page.tsx` - Org list (server)
- `src/app/[locale]/(superadmin)/admin/organizations/orgs-page-client.tsx` - Org list (client)
- `src/app/[locale]/(superadmin)/admin/organizations/new/page.tsx` - Create org (server)
- `src/app/[locale]/(superadmin)/admin/organizations/new/create-org-form.tsx` - Create org form (client)
- `src/app/[locale]/(superadmin)/admin/organizations/[id]/page.tsx` - Org detail (server)
- `src/app/[locale]/(superadmin)/admin/organizations/[id]/org-detail-client.tsx` - Org detail (client)
- `src/components/admin/stat-card.tsx` - Reusable stat card component with icon, value, trend
- `src/app/[locale]/(auth)/invite/[token]/page.tsx` - Invitation acceptance page (server)
- `src/app/[locale]/(auth)/invite/[token]/invite-client.tsx` - Invitation acceptance UI (client)
- `src/app/[locale]/(auth)/invite/[token]/actions.ts` - Invitation validation and acceptance server actions
- `src/components/layout/app-shell.tsx` - Main wrapper (sidebar + header + content)
- `src/components/layout/sidebar.tsx` - Navigation sidebar with nav links
- `src/components/layout/header.tsx` - Top bar with menu toggle, theme, user menu
- `src/app/[locale]/(superadmin)/admin/activity/page.tsx` - Activity page (server)
- `src/app/[locale]/(superadmin)/admin/activity/activity-page-client.tsx` - Activity log table (client)
- `src/lib/audit/log.ts` - Audit logging helper (logAudit, AuditAction type)
- `src/lib/db/schema/audit-logs.ts` - Audit logs table schema
- `src/components/layout/admin-sidebar.tsx` - Superadmin navigation sidebar (5 items)
- `src/components/shared/theme-provider.tsx` - next-themes ThemeProvider wrapper
- `src/components/shared/theme-toggle.tsx` - Dark mode toggle dropdown
- `drizzle.config.ts` - Drizzle Kit configuration
- `src/lib/db/schema/enums.ts` - All PostgreSQL enums (incl. platform_role, invitation_status)
- `src/lib/db/schema/organizations.ts` - Organizations table
- `src/lib/db/schema/users.ts` - Users table (with platform_role, extended profile fields)
- `src/lib/db/schema/organization-members.ts` - Org members junction table
- `src/lib/db/schema/analysis-subjects.ts` - Analysis subjects table
- `src/lib/db/schema/consents.ts` - Consents table
- `src/lib/db/schema/analysis-jobs.ts` - Analysis jobs table
- `src/lib/db/schema/reports.ts` - Reports table
- `src/lib/db/schema/team-invitations.ts` - Team invitations table
- `src/lib/db/schema/index.ts` - Schema re-exports
- `src/lib/db/index.ts` - Drizzle client instance
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/supabase/admin.ts` - Service-role client (superadmin)
- `src/lib/supabase/middleware.ts` - Auth middleware helper
- `src/lib/auth/roles.ts` - RBAC role definitions (org + platform roles)
- `src/lib/auth/permissions.ts` - Permission check functions
- `src/lib/auth/require-platform-role.ts` - Server-side platform role guard
- `src/lib/validations/admin.ts` - Zod schemas for admin forms
- `src/types/database.ts` - Drizzle inferred types
- `src/types/index.ts` - Type re-exports
- `supabase/migrations/001_enable_rls.sql` - Enable RLS on all tables
- `supabase/migrations/002_tenant_isolation_policies.sql` - Tenant isolation policies
- `src/middleware.ts` - Three-layer middleware (locale + subdomain + auth)
- `src/lib/i18n/request.ts` - next-intl server request config
- `src/lib/i18n/routing.ts` - Locale routing definition
- `src/lib/i18n/navigation.ts` - next-intl navigation helpers
- `src/app/[locale]/(auth)/layout.tsx` - Auth layout (centered card)
- `src/app/[locale]/(auth)/login/page.tsx` - Login page with Supabase auth
- `src/app/[locale]/(auth)/register/page.tsx` - Register page with Supabase auth
- `src/app/api/auth/callback/route.ts` - Auth callback for magic link/OAuth
- `src/hooks/use-tenant.ts` - Client-side organization context hook
- `src/hooks/use-role.ts` - Client-side user role hook (platformRole + orgRole)
- `src/lib/constants.ts` - App constants
- `src/lib/utils.ts` - cn() utility
- `src/messages/de.json` / `en.json` - Comprehensive translation files
- `.env.example` - Environment variable template
