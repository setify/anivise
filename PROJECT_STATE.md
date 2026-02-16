# Project State

**Version:** 0.1.0
**Last Updated:** 2026-02-16
**Last Commit:** chore: initial project scaffold v0.1.0

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
- [ ] Drizzle ORM configured with PostgreSQL
- [ ] Schema: organizations, users, organization_members
- [ ] Schema: analysis_subjects, consents
- [ ] Schema: analysis_jobs, reports
- [ ] Supabase clients (browser, server, admin)
- [ ] RLS policies applied to Supabase

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
- Supabase client setup (browser, server, admin)
- Drizzle ORM schema and migrations
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
- Package.json db:* scripts reference drizzle-kit but it is not yet installed (will be added in v0.2.0)
- next-themes is installed but ThemeProvider is not yet wired into layouts (will be added in v0.4.0)

## File Map (Key Files)
- `src/app/layout.tsx` - Root layout with fonts and metadata
- `src/app/[locale]/layout.tsx` - Locale layout with NextIntlClientProvider
- `src/app/[locale]/page.tsx` - Home page
- `src/middleware.ts` - next-intl locale routing (will be extended with auth + subdomain)
- `src/lib/i18n/request.ts` - next-intl server request config
- `src/lib/i18n/routing.ts` - Locale routing definition
- `src/lib/constants.ts` - App constants (name, locales)
- `src/lib/utils.ts` - cn() utility for Tailwind class merging
- `src/messages/de.json` / `en.json` - Translation files
- `src/types/api.ts` - API response type definitions
- `.env.example` - Environment variable template
- `next.config.ts` - Next.js config with next-intl plugin
