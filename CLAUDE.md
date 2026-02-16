# CLAUDE.md – Project Instructions for Claude Code

## Project Overview

This is a **B2B SaaS platform for AI-powered psychodynamic pattern analysis** in leadership decisions. The platform helps organizations place people in roles where they thrive – not burn out.

**Core Product:** AI-driven analysis of conversations to detect psychodynamic patterns, delivering actionable orientation for leadership decisions (hiring, promotion, development, due diligence).

**This is NOT:** a diagnostic tool, an automated hiring system, a surveillance tool, or a therapy replacement. It is a **Decision Support System** – the AI informs, humans decide. Always.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | PostgreSQL via Supabase |
| **ORM / DB Access** | Drizzle ORM (schema, migrations, complex queries) + Supabase Client (auth-related queries, realtime, storage) |
| **Auth** | Supabase Auth |
| **File Storage** | Supabase Storage (with RLS) |
| **Email** | Resend |
| **Analysis Engine** | n8n (self-hosted, external – NOT in this codebase) |
| **i18n** | next-intl (German + English from day one) |
| **Package Manager** | pnpm |
| **Hosting** | Vercel |
| **Monorepo** | Single repo, no workspaces needed (yet) |

---

## Project Structure

```
/
├── CLAUDE.md                    # Agent instructions (this file)
├── PROJECT_STATE.md             # Living doc: what's built, what's not (READ FIRST!)
├── CHANGELOG.md                 # Version history of all changes
├── README.md                    # Technical documentation (setup, architecture, usage)
├── package.json                 # Version tracked here (SemVer)
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── .env.local                   # Local env vars (never commit)
├── .env.example                 # Template for env vars
│
├── public/
│   └── locales/                 # Static assets
│
├── src/
│   ├── app/
│   │   ├── [locale]/            # i18n dynamic segment (next-intl)
│   │   │   ├── (auth)/          # Auth routes (login, register, magic-link)
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/     # Authenticated app routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── analyses/
│   │   │   │   ├── team/
│   │   │   │   ├── settings/
│   │   │   │   └── layout.tsx
│   │   │   ├── (superadmin)/    # Superadmin routes (org management)
│   │   │   │   ├── admin/
│   │   │   │   └── layout.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/                 # API routes
│   │   │   ├── webhooks/        # n8n callback webhooks
│   │   │   └── ...
│   │   └── layout.tsx           # Root layout
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (auto-generated)
│   │   ├── layout/              # Shell, Sidebar, Header, etc.
│   │   ├── forms/               # Reusable form components
│   │   ├── analyses/            # Analysis-specific components
│   │   └── shared/              # Shared/generic components
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser Supabase client
│   │   │   ├── server.ts        # Server-side Supabase client
│   │   │   ├── admin.ts         # Service-role client (superadmin ops)
│   │   │   └── middleware.ts    # Auth middleware helper
│   │   ├── db/
│   │   │   ├── schema/          # Drizzle schema definitions
│   │   │   │   ├── organizations.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── analyses.ts
│   │   │   │   ├── reports.ts
│   │   │   │   └── index.ts     # Re-exports all schemas
│   │   │   ├── migrations/      # Drizzle migrations
│   │   │   └── index.ts         # Drizzle client instance
│   │   ├── n8n/
│   │   │   └── trigger.ts       # Webhook trigger to n8n
│   │   ├── email/
│   │   │   └── resend.ts        # Resend client & templates
│   │   ├── auth/
│   │   │   ├── roles.ts         # Role definitions & checks
│   │   │   └── permissions.ts   # Permission helpers
│   │   ├── i18n/
│   │   │   ├── request.ts       # next-intl server config
│   │   │   └── routing.ts       # Locale routing config
│   │   ├── utils.ts             # General utilities
│   │   └── constants.ts         # App-wide constants
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-tenant.ts        # Current tenant/org context
│   │   ├── use-role.ts          # Current user role
│   │   └── ...
│   │
│   ├── types/
│   │   ├── database.ts          # Drizzle inferred types
│   │   ├── api.ts               # API request/response types
│   │   ├── analysis.ts          # Analysis-related types
│   │   └── index.ts
│   │
│   ├── messages/                # next-intl translation files
│   │   ├── de.json
│   │   └── en.json
│   │
│   └── middleware.ts            # Next.js middleware (subdomain resolution + auth + i18n)
│
├── supabase/
│   ├── migrations/              # Supabase SQL migrations (RLS policies etc.)
│   └── seed.sql                 # Seed data for development
│
└── drizzle/
    └── migrations/              # Drizzle-managed migrations
```

---

## Architecture Principles

### 1. Multi-Tenancy (Critical)

**Model:** Single database, shared schema, tenant isolation via `organization_id` column.

**Rules:**
- **EVERY** table that contains tenant-specific data MUST have an `organization_id` column (UUID, NOT NULL, FK to `organizations`).
- **EVERY** query for tenant data MUST filter by `organization_id`. No exceptions.
- Supabase RLS policies MUST be set up as an additional safety net.
- The `organizations` table and `superadmin`-level tables are the only exceptions.
- **NEVER** write a query that could return data from another tenant. When in doubt, add the filter.

**Subdomain Resolution:**
- Each organization gets a subdomain: `{org_slug}.app-domain.com`
- The Next.js middleware resolves the subdomain → looks up `organization_id` → injects it into the request context.
- Superadmin panel lives on `admin.app-domain.com` or `app-domain.com/admin`.
- Auth pages live on the main domain: `app-domain.com/login`.

```typescript
// middleware.ts – Subdomain resolution pattern
// 1. Extract subdomain from hostname
// 2. Look up org by slug
// 3. Set org context (header or cookie)
// 4. Rewrite to appropriate route
```

### 2. Role-Based Access Control (RBAC)

**4-tier hierarchy:**

| Role | Scope | Capabilities |
|------|-------|-------------|
| `superadmin` | Platform-wide | Create/manage organizations, view all orgs, platform settings |
| `org_admin` | Organization | Manage org settings, users, billing; view all org data |
| `manager` | Team/Department | View team analyses, request analyses, manage team members |
| `member` | Self only | View own analysis results, upload own transcripts, consent management |

**Implementation Rules:**
- Role is stored in a `organization_members` junction table (user_id + organization_id + role).
- A user CAN belong to multiple organizations (e.g., a coach working with several companies).
- Superadmin role is a flag on the `users` table (NOT tied to an organization).
- Always check role server-side. Client-side checks are for UX only, never for security.
- Use middleware or server-side helpers to enforce access. Never trust client input for role.

### 3. Analysis Pipeline (n8n Integration)

**Flow:**
1. User uploads transcript → stored in Supabase Storage (tenant-isolated bucket/path)
2. App creates entry in `analysis_jobs` table (status: `pending`)
3. App triggers n8n webhook with `{ jobId, organizationId, fileUrl, callbackUrl }`
4. n8n processes the analysis (external, not in this codebase)
5. n8n calls back via webhook: `POST /api/webhooks/n8n/analysis-complete`
6. Callback handler validates request, updates `analysis_jobs` status, stores report
7. Frontend receives update via Supabase Realtime subscription on the job row

**Security for n8n Communication:**
- n8n webhook trigger: use a shared secret in the header (`X-N8N-Secret`)
- n8n callback: validate the shared secret, validate the job exists, validate org ownership
- Never expose Supabase service-role key to n8n. Use a dedicated API route with scoped permissions.

**Job Statuses:** `pending` → `processing` → `completed` | `failed` | `cancelled`

### 4. Consent & Ethics (Non-Negotiable)

These rules are **hardcoded into the platform logic**, not just policy:

- **No analysis without explicit consent.** The `consent` table tracks who consented, when, and for what. Analysis cannot start without a valid consent record.
- **Every analyzed person sees their own results.** The system MUST provide access to the analyzed person's report. This is not optional.
- **No binary labels.** Reports never output "fit/unfit", "suitable/unsuitable". Always frame as patterns, development areas, and action options.
- **Human in the Loop.** Reports are labeled as "Orientation" (Orientierung), not "Recommendation" (Empfehlung) or "Decision" (Entscheidung).
- **Deletion capability.** Users can delete their data. Implement soft-delete with a hard-delete cron after retention period.

---

## Database Schema Conventions

### General Rules

- Use `snake_case` for all table and column names.
- Every table has: `id` (UUID, default `gen_random_uuid()`), `created_at` (timestamptz), `updated_at` (timestamptz).
- Tenant tables always have `organization_id` (UUID, NOT NULL, FK).
- Use Drizzle for schema definition and migrations. Keep Supabase SQL migrations for RLS policies only.
- Soft-delete via `deleted_at` column (nullable timestamptz) where needed.

### Core Tables

```
organizations
├── id (UUID, PK)
├── name (text, NOT NULL)
├── slug (text, UNIQUE, NOT NULL)  -- used for subdomain
├── settings (jsonb)                -- org-specific config
├── subscription_tier (enum: 'individual' | 'team' | 'enterprise')
├── subscription_status (enum: 'trial' | 'active' | 'cancelled' | 'expired')
├── created_at
├── updated_at
└── deleted_at

users
├── id (UUID, PK)                   -- matches Supabase Auth user ID
├── email (text, UNIQUE, NOT NULL)
├── full_name (text)
├── avatar_url (text)
├── is_superadmin (boolean, default false)
├── preferred_locale (enum: 'de' | 'en')
├── created_at
├── updated_at
└── deleted_at

organization_members
├── id (UUID, PK)
├── organization_id (UUID, FK → organizations, NOT NULL)
├── user_id (UUID, FK → users, NOT NULL)
├── role (enum: 'org_admin' | 'manager' | 'member')
├── invited_by (UUID, FK → users)
├── joined_at (timestamptz)
├── created_at
├── updated_at
└── UNIQUE(organization_id, user_id)

analysis_subjects
├── id (UUID, PK)
├── organization_id (UUID, FK, NOT NULL)
├── full_name (text, NOT NULL)
├── email (text)
├── role_title (text)               -- their job role
├── created_by (UUID, FK → users)
├── created_at
├── updated_at
└── deleted_at

consents
├── id (UUID, PK)
├── organization_id (UUID, FK, NOT NULL)
├── subject_id (UUID, FK → analysis_subjects, NOT NULL)
├── granted_by_user_id (UUID, FK → users)  -- who clicked consent
├── consent_type (enum: 'analysis' | 'data_retention' | 'sharing')
├── status (enum: 'active' | 'revoked')
├── granted_at (timestamptz, NOT NULL)
├── revoked_at (timestamptz)
├── ip_address (text)
├── consent_text_version (text)     -- version of consent text shown
├── created_at
└── updated_at

analysis_jobs
├── id (UUID, PK)
├── organization_id (UUID, FK, NOT NULL)
├── subject_id (UUID, FK → analysis_subjects, NOT NULL)
├── consent_id (UUID, FK → consents, NOT NULL)
├── requested_by (UUID, FK → users, NOT NULL)
├── status (enum: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled')
├── transcript_storage_path (text, NOT NULL)  -- path in Supabase Storage
├── n8n_webhook_triggered_at (timestamptz)
├── n8n_callback_received_at (timestamptz)
├── error_message (text)
├── metadata (jsonb)                -- any extra context for n8n
├── created_at
├── updated_at
└── deleted_at

reports
├── id (UUID, PK)
├── organization_id (UUID, FK, NOT NULL)
├── analysis_job_id (UUID, FK → analysis_jobs, NOT NULL, UNIQUE)
├── subject_id (UUID, FK → analysis_subjects, NOT NULL)
├── report_data (jsonb, NOT NULL)   -- structured report content
├── report_version (text)           -- version of analysis framework
├── generated_at (timestamptz)
├── viewed_by_subject (boolean, default false)
├── viewed_by_subject_at (timestamptz)
├── created_at
├── updated_at
└── deleted_at
```

### Supabase RLS Policy Pattern

```sql
-- Example: analysis_jobs table
-- Tenant isolation: users can only see their own org's data
CREATE POLICY "tenant_isolation" ON analysis_jobs
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Superadmin bypass (use service-role client instead, not RLS bypass)
```

---

## Coding Standards

### TypeScript

- **Strict mode** enabled. No `any` types unless absolutely necessary (and then with a comment explaining why).
- Use Drizzle's inferred types for database entities. Don't manually duplicate types.
- Use `zod` for runtime validation of API inputs, form data, and n8n webhook payloads.
- Prefer `interface` for object shapes, `type` for unions and computed types.

### Next.js / React

- **Server Components by default.** Only use `'use client'` when you need interactivity, browser APIs, or hooks.
- Use Server Actions for form mutations. Use API routes only for external callbacks (n8n webhook) and complex operations.
- **No prop drilling** for tenant/auth context. Use server-side helpers to get current org and user.
- Loading and error states: use `loading.tsx` and `error.tsx` files in the App Router.
- Use `Suspense` boundaries for async components.

### Supabase Client Usage

```typescript
// RULE: Use the right client for the right context

// Browser (Client Components):
import { createBrowserClient } from '@/lib/supabase/client'

// Server Components / Server Actions / Route Handlers:
import { createServerClient } from '@/lib/supabase/server'

// Superadmin operations (bypasses RLS):
import { createAdminClient } from '@/lib/supabase/admin'
// ⚠️ ONLY use admin client for superadmin operations. NEVER in regular user flows.
```

### Drizzle Usage

```typescript
// Schema definitions in src/lib/db/schema/
// Always include organization_id for tenant tables:
export const analysisJobs = pgTable('analysis_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  // ... other columns
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Queries – ALWAYS filter by organization_id:
const jobs = await db
  .select()
  .from(analysisJobs)
  .where(eq(analysisJobs.organizationId, currentOrgId)) // MANDATORY
```

### Styling

- Use **shadcn/ui** components as the base. Don't build custom components when shadcn has one.
- Use **Tailwind CSS** for all styling. No CSS modules, no styled-components.
- Follow a consistent color scheme. Use CSS variables defined in `globals.css` (shadcn convention).
- Design for **responsive** (mobile-first), but the primary interface is desktop (B2B SaaS dashboard).
- Dark mode support from the start (shadcn supports this natively).

### Internationalization (i18n)

- Use **next-intl** with the App Router integration.
- Translation files in `src/messages/{locale}.json`.
- Default locale: `de`. Supported locales: `['de', 'en']`.
- **All user-facing strings** must go through translations. No hardcoded German or English in components.
- Use namespace-based keys: `auth.login.title`, `dashboard.analyses.empty`, etc.
- Date/number formatting through next-intl's formatting utilities.

```typescript
// In Server Components:
import { useTranslations } from 'next-intl'
const t = useTranslations('dashboard')
// Usage: t('analyses.title')

// In Client Components:
import { useTranslations } from 'next-intl'
```

---

## Middleware Logic

The Next.js middleware handles three concerns in order:

```
1. LOCALE DETECTION
   → Determine locale from URL, cookie, or Accept-Language header

2. SUBDOMAIN RESOLUTION
   → Extract subdomain from hostname
   → If subdomain exists: look up organization by slug
   → If not found: redirect to main domain (404 or landing)
   → If found: inject org context into headers

3. AUTH CHECK
   → Verify Supabase session
   → If not authenticated + protected route: redirect to login
   → If authenticated: verify user is member of resolved org
   → If not member: show "no access" page
```

---

## Environment Variables

```bash
# .env.local (NEVER commit this file)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx           # Server-only, never expose

# App
NEXT_PUBLIC_APP_DOMAIN=localhost:3000    # Production: app-domain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# n8n
N8N_WEBHOOK_URL=https://n8n.your-server.com/webhook/xxx
N8N_WEBHOOK_SECRET=xxx                  # Shared secret for auth

# Resend (Email)
RESEND_API_KEY=xxx
RESEND_FROM_EMAIL=noreply@app-domain.com

# next-intl
NEXT_PUBLIC_DEFAULT_LOCALE=de
```

---

## API Route Conventions

- API routes live in `src/app/api/`.
- Always validate input with `zod`.
- Always check authentication and authorization.
- Always filter by `organization_id` for tenant data.
- Return consistent response shapes:

```typescript
// Success:
{ success: true, data: { ... } }

// Error:
{ success: false, error: { code: 'UNAUTHORIZED', message: '...' } }
```

### n8n Webhook Callback Route

```typescript
// POST /api/webhooks/n8n/analysis-complete
// 1. Validate X-N8N-Secret header
// 2. Parse and validate body with zod
// 3. Look up analysis_job by ID
// 4. Verify job exists and belongs to claimed org
// 5. Update job status
// 6. Store report data
// 7. Return 200
```

---

## File Storage Structure (Supabase Storage)

```
transcripts/
└── {organization_id}/
    └── {analysis_job_id}/
        └── transcript.{ext}       # Original uploaded file

reports/
└── {organization_id}/
    └── {report_id}/
        └── report.pdf             # Generated PDF (if applicable)
```

- Bucket-level RLS: users can only access files within their `organization_id` path.
- Upload goes through a Server Action (not direct client upload) to enforce consent checks.

---

## Key Business Logic Rules

### Analysis Request Flow
1. Check: Does the subject have an active consent record? → If no, block.
2. Check: Does the requester have permission (org_admin or manager)? → If no, block.
3. Check: Is there already a pending/processing job for this subject? → If yes, warn.
4. Create `analysis_jobs` entry with status `pending`.
5. Upload transcript to Supabase Storage.
6. Trigger n8n webhook.
7. Update status to `processing` when n8n acknowledges.

### Report Access Rules
- The **analyzed subject** (if they have a user account) can ALWAYS see their own report.
- **Managers** can see reports of their team members.
- **Org Admins** can see all reports in their organization.
- **Superadmins** can see all reports (via admin panel with admin client).
- No one outside the organization can see any report. Ever.

### Consent Revocation
- When consent is revoked: mark as `revoked`, cancel any pending jobs.
- Completed reports enter a grace period (configurable, e.g., 30 days), then soft-delete.
- Hard-delete runs via a scheduled job (cron or Supabase function).

---

## Language & Terminology Rules (Product-Specific)

When writing UI text, labels, tooltips, or any user-facing content:

### Always Use:
- "Muster" / "Patterns" (not "Diagnose" / "Diagnosis")
- "Orientierung" / "Orientation" (not "Bewertung" / "Assessment Score")
- "Entwicklung" / "Development" (not "Optimierung" / "Optimization")
- "Passung" / "Fit" (not "Eignung" / "Suitability")
- "Handlungsoptionen" / "Action Options" (not "Empfehlungen" / "Recommendations")

### Never Use:
- "Psychoanalyse" / "Psychoanalysis"
- "Diagnose" / "Diagnosis"
- "Aussortieren" / "Filter out"
- "Vorhersagen" / "Predict"
- "Garantie" / "Guarantee"

### Report Disclaimer (must appear on every report):
> DE: "Diese Analyse basiert auf den vorliegenden Gesprächsdaten und zeigt mögliche Muster. Sie ist keine psychologische Diagnose und ersetzt nicht die menschliche Einschätzung."
>
> EN: "This analysis is based on the available conversation data and shows possible patterns. It is not a psychological diagnosis and does not replace human judgment."

---

## Testing Approach

- Use **Vitest** for unit/integration tests.
- Use **Playwright** for E2E tests (critical flows: login, analysis request, report view).
- Test multi-tenancy isolation: write tests that verify Org A cannot access Org B's data.
- Test consent enforcement: verify analysis cannot start without consent.
- Test RBAC: verify each role can only do what it's allowed to.

---

## Git Conventions

- Branch naming: `feature/xxx`, `fix/xxx`, `chore/xxx`
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Always include the affected area: `feat(auth): add magic link login`
- PR required for `main` branch.

---

## Versioning (Semantic Versioning)

This project uses **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Breaking change (DB schema, API contract, auth flow) | MAJOR | 1.0.0 → 2.0.0 |
| New feature, new page, new integration | MINOR | 1.0.0 → 1.1.0 |
| Bug fix, refactor, styling tweak, text change | PATCH | 1.0.0 → 1.0.1 |

**Rules:**
- The version is tracked in `package.json` (`"version": "x.y.z"`).
- **Every significant change MUST bump the version** before committing.
- Use `pnpm version patch`, `pnpm version minor`, or `pnpm version major` to bump.
- The CHANGELOG.md is the single source of truth for what changed in each version.
- Pre-1.0.0 (MVP phase): treat MINOR bumps as "new feature", PATCH as "fix/tweak". Breaking changes can still be MINOR during 0.x.

---

## Git & Commit Rules

### Commit Convention

Every commit follows **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` – New feature or functionality
- `fix` – Bug fix
- `refactor` – Code change that neither adds feature nor fixes bug
- `chore` – Build process, dependencies, tooling
- `docs` – Documentation changes
- `style` – Formatting, no code change
- `test` – Adding or updating tests
- `perf` – Performance improvement

**Scopes** (use the affected area):
`auth`, `db`, `ui`, `api`, `middleware`, `i18n`, `n8n`, `storage`, `rbac`, `admin`, `config`, `deps`

**Examples:**
```bash
feat(db): add analysis_jobs and reports schema
fix(auth): resolve subdomain resolution for localhost
refactor(middleware): extract tenant resolution into helper
chore(deps): update drizzle-orm to 0.35.x
docs: update README with Supabase setup instructions
```

### Commit Frequency

**Commit after every logical unit of work.** Specifically:

- ✅ After completing a new feature or page
- ✅ After fixing a bug
- ✅ After adding/modifying a database schema
- ✅ After setting up a new integration (Resend, n8n, etc.)
- ✅ After significant refactoring
- ✅ After adding/updating tests
- ✅ After updating configuration or dependencies

**Do NOT** make single mega-commits with dozens of unrelated changes.

### After Each Commit: Update CHANGELOG.md and README.md

1. **Bump version** in `package.json` (patch/minor/major as appropriate)
2. **Update CHANGELOG.md** with what changed (see format below)
3. **Update README.md** if the change affects setup, usage, architecture, or available features
4. **Update PROJECT_STATE.md** with current implementation status

---

## CHANGELOG.md Format

```markdown
# Changelog

## [0.3.0] - 2025-XX-XX
### Added
- Dashboard layout with sidebar navigation
- Dark mode toggle
- German and English translations for navigation

### Changed
- Moved auth pages to (auth) route group

### Fixed
- Middleware locale detection for subdomains

## [0.2.0] - 2025-XX-XX
### Added
- Drizzle schema for all core tables
- Supabase client setup (browser, server, admin)
- RLS policy templates

## [0.1.0] - 2025-XX-XX
### Added
- Initial project scaffold (Next.js, Tailwind, shadcn/ui)
- Project structure from CLAUDE.md
- Environment configuration
```

---

## PROJECT_STATE.md (Living Document)

This file is **critical**. It is the agent's memory of what exists and what doesn't. It MUST be kept up to date after every commit.

**Location:** `PROJECT_STATE.md` in project root.

**Purpose:** When Claude Code starts a new session (or a new teammate joins), it reads this file to understand what has been built, what works, and what's next.

**Format:**

```markdown
# Project State

**Version:** 0.3.0
**Last Updated:** 2025-XX-XX
**Last Commit:** feat(ui): add dashboard layout with sidebar

## What's Implemented ✅

### Infrastructure
- [x] Next.js 14 App Router with TypeScript strict mode
- [x] Tailwind CSS + shadcn/ui configured
- [x] next-intl with de/en translations
- [x] pnpm as package manager
- [x] ESLint + Prettier configured

### Database
- [x] Drizzle ORM configured with PostgreSQL
- [x] Schema: organizations, users, organization_members
- [x] Schema: analysis_subjects, consents
- [x] Schema: analysis_jobs, reports
- [x] Supabase clients (browser, server, admin)
- [ ] RLS policies applied to Supabase (needs manual step)

### Authentication
- [x] Supabase Auth integration
- [x] Login page (email/password + magic link)
- [x] Register page
- [x] Middleware: auth check
- [x] Middleware: subdomain → org resolution
- [ ] OAuth (Google/Microsoft) – placeholder only
- [ ] SSO/SAML – not started

### RBAC
- [x] Role definitions (superadmin, org_admin, manager, member)
- [x] Permission helper functions
- [x] Role-based middleware guards
- [ ] UI-level permission checks in components

### UI / Pages
- [x] Auth layout + pages (login, register)
- [x] Dashboard layout (sidebar, header, app shell)
- [x] Dashboard page (placeholder)
- [x] Analyses page (placeholder)
- [x] Team page (placeholder)
- [x] Settings page (placeholder)
- [x] Superadmin layout + admin page (placeholder)
- [x] Dark mode toggle
- [ ] Analysis upload flow – not started
- [ ] Report viewer – not started

### Integrations
- [ ] n8n webhook trigger – not started
- [ ] n8n callback handler – not started
- [ ] Resend email – not started
- [ ] Supabase Storage upload flow – not started

## What's NOT Implemented Yet ❌
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
- (list any known issues here)

## File Map (Key Files)
- `src/middleware.ts` – Locale + subdomain + auth
- `src/lib/db/schema/` – All Drizzle schemas
- `src/lib/supabase/` – Supabase clients
- `src/lib/auth/roles.ts` – RBAC definitions
- `src/app/[locale]/(dashboard)/layout.tsx` – Main app layout
- `src/messages/de.json` / `en.json` – Translations
```

### Rules for PROJECT_STATE.md

1. **Read it FIRST** at the start of every session. Before writing any code, read `PROJECT_STATE.md` to understand current state.
2. **Update it LAST** after every commit. Check off completed items, add new items, update version and last commit info.
3. **Be honest.** If something is half-done, mark it as such. If something is broken, note it under "Known Issues".
4. **Keep it concise.** This is a status dashboard, not prose. Use checkboxes and short descriptions.

---

## README.md (Technical Documentation)

The `README.md` is the **complete technical documentation** of the project. It must be kept up to date and serve as the primary reference for any developer (or AI agent) joining the project.

### Required Sections

```markdown
# Anivise Platform

> AI-powered psychodynamic pattern analysis for leadership decisions.

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Supabase account
- (Optional) n8n instance for analysis

### Installation
\`\`\`bash
git clone <repo>
cd anivise
pnpm install
cp .env.example .env.local
# Fill in Supabase credentials
pnpm dev
\`\`\`

## Tech Stack
(Table with all technologies and their role)

## Architecture

### Multi-Tenancy
(How subdomain resolution works, organization_id isolation)

### Authentication & Authorization
(Supabase Auth setup, login methods, RBAC roles and permissions)

### Database Schema
(ER diagram or table descriptions, how to run migrations)

### n8n Integration
(How the analysis pipeline works, webhook flow, job statuses)

### File Storage
(Supabase Storage structure, RLS on files)

### Internationalization
(How next-intl is set up, how to add translations)

## Available Scripts
(All pnpm scripts with descriptions)

## Project Structure
(Folder tree with explanations)

## Environment Variables
(Table of all env vars with descriptions, which are required)

## Deployment
(How to deploy to Vercel, environment setup)

## Database Management
\`\`\`bash
pnpm db:generate  # Generate Drizzle types from schema
pnpm db:migrate   # Run pending migrations
pnpm db:push      # Push schema to Supabase (dev only)
pnpm db:studio    # Open Drizzle Studio (DB browser)
\`\`\`

## Contributing
(Commit conventions, branch naming, PR process)
```

### Rules for README.md

1. **Update after every feature or integration.** If you add n8n integration, document it in README.
2. **Include code examples.** Show how to use key utilities (Supabase clients, permission checks, tenant context).
3. **Keep the Quick Start working.** After every change, verify the README setup steps still work.
4. **No stale docs.** If something changes, the README changes with it. Same commit.

---

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run Drizzle migrations
pnpm db:migrate

# Generate Drizzle types
pnpm db:generate

# Push schema to Supabase (development)
pnpm db:push

# Run tests
pnpm test

# Lint
pnpm lint

# Type check
pnpm typecheck
```

### Workflow for Every Change

```
1. Make the code change
2. Verify it works (pnpm build, pnpm typecheck)
3. Bump version: pnpm version patch|minor|major
4. Update CHANGELOG.md
5. Update PROJECT_STATE.md
6. Update README.md (if setup/architecture/features affected)
7. Commit: git add -A && git commit -m "type(scope): description"
```

**This workflow is MANDATORY. No exceptions. Every teammate in an Agent Team follows this.**

---

## Important Reminders

1. **Multi-tenancy is the #1 concern.** Every feature, every query, every API route must be tenant-aware. If you're not filtering by `organization_id`, you're creating a security vulnerability.

2. **Consent is non-negotiable.** Never allow analysis to start without verified consent. This is both an ethical and legal requirement (GDPR, EU AI Act).

3. **The analyzed person always sees their result.** This is a core product principle. Build the system so this is impossible to bypass.

4. **n8n is external.** This codebase handles the platform (UI, auth, storage, job management). The actual analysis logic lives in n8n workflows. Our responsibility is to trigger correctly, handle callbacks securely, and display results.

5. **Internationalization from day one.** Every string goes through next-intl. No exceptions. It's much harder to retrofit than to build in.

6. **Supabase RLS is a safety net, not the primary guard.** Always filter by `organization_id` in application code AND set up RLS policies. Belt and suspenders.

7. **Always read PROJECT_STATE.md first.** Before writing any code, understand what exists. Before committing, update the state.

8. **Every change gets a version, a commit, and updated docs.** No silent changes. The project history must be traceable and the documentation must reflect reality.
