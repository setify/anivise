# Anivise Platform

> AI-powered psychodynamic pattern analysis for leadership decisions.

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Supabase account (for database and auth)
- (Optional) n8n instance for analysis processing

### Installation
```bash
git clone <repo>
cd anivise
pnpm install
cp .env.example .env.local
# Fill in your Supabase credentials and other env vars
pnpm dev
```

The development server starts at [http://localhost:3001](http://localhost:3001).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Supabase |
| ORM / DB Access | Drizzle ORM + Supabase Client |
| Auth | Supabase Auth |
| File Storage | Supabase Storage (with RLS) |
| Email | Resend |
| Analysis Engine | n8n (self-hosted, external) |
| i18n | next-intl (German + English) |
| Package Manager | pnpm |
| Hosting | Vercel |

## Architecture

### Multi-Tenancy
The platform uses a single database with shared schema. Tenant isolation is enforced via `organization_id` columns on all tenant-specific tables. Each organization gets a subdomain (`{org_slug}.app-domain.com`), resolved by Next.js middleware.

### Authentication & Authorization

**Auth Provider:** Supabase Auth with `@supabase/ssr` for cookie-based session management.

**Login Methods:**
- Email + password (functional)
- Magic link via email (functional)
- Google OAuth (placeholder, coming soon)
- Microsoft OAuth (placeholder, coming soon)

**RBAC:** 4-tier hierarchy with numeric levels for comparison:

| Role | Level | Scope |
|------|-------|-------|
| `superadmin` | 100 | Platform-wide (flag on users table) |
| `org_admin` | 75 | Organization-level |
| `manager` | 50 | Team/department |
| `member` | 25 | Self only |

Roles are stored in the `organization_members` junction table. Platform role (`superadmin` | `staff`) is stored on the `users` table (not org-scoped).

### Invitation Flow

The platform uses a unified invitation system for both platform team members and organization admins. Invitations are stored in the `team_invitations` table with `invitation_type` distinguishing between `platform` and `organization` invitations.

**Flow:**
1. Admin creates invitation (generates token, stores in DB)
2. Invitee receives link: `/{locale}/invite/{token}`
3. If logged in: one-click acceptance
4. If not logged in: register or sign in, then accept
5. On acceptance: platform role is set (for platform invitations) or organization membership is created (for org invitations)

**Permission Helpers:**
```typescript
import { hasRole } from '@/lib/auth/roles'
import { canManageOrganization, canRequestAnalysis } from '@/lib/auth/permissions'

// Check hierarchy: does userRole meet requiredRole?
hasRole('manager', 'member') // true
hasRole('member', 'org_admin') // false

// Specific permission checks
canManageOrganization('org_admin') // true
canRequestAnalysis('member') // false
canViewReport('member', true) // true (own report)
```

**Client-Side Hooks (UX only, not security):**
```typescript
import { useTenant } from '@/hooks/use-tenant'
import { useRole } from '@/hooks/use-role'

const { organizationSlug, isLoading } = useTenant()
const { role, isSuperadmin, isLoading } = useRole()
```

### Middleware

The Next.js middleware (`src/middleware.ts`) handles three concerns in order:

1. **Locale Detection:** next-intl determines locale from URL, cookie, or Accept-Language header
2. **Subdomain Resolution:** Extracts subdomain from hostname, injects `x-organization-slug` header. In development (localhost), supports `?org=slug` query param or `x-organization-slug` header fallback
3. **Auth Check:** Refreshes Supabase session tokens, redirects unauthenticated users on protected routes to `/login` with a `redirectTo` parameter

**Auth Callback:** `GET /api/auth/callback` handles magic link and OAuth redirects by exchanging the auth code for a session

### Database Schema

The database is managed via **Drizzle ORM** with schemas defined in `src/lib/db/schema/`. All migrations are output to `drizzle/migrations/`.

#### Core Tables

| Table | Description | Tenant-Isolated |
|-------|-------------|-----------------|
| `organizations` | Organizations with slug, subscription tier/status | No (root table) |
| `users` | Users linked to Supabase Auth by ID | No (global) |
| `organization_members` | Junction: user + org + role (unique constraint) | Yes |
| `analysis_subjects` | People being analyzed | Yes |
| `consents` | Consent records (type, status, timestamps) | Yes |
| `analysis_jobs` | Analysis job lifecycle (pending -> completed/failed) | Yes |
| `reports` | Analysis results (jsonb report_data, 1:1 with job) | Yes |
| `team_invitations` | Platform + org invitations with token-based acceptance | No (global) |
| `forms` | Form definitions with slug, visibility, completion config, versioning | Optional (platform or org-scoped) |
| `form_versions` | Versioned JSON schema for each form | No (linked to form) |
| `form_organization_assignments` | Which orgs can access which forms | Yes |
| `form_submissions` | Submitted form data with version reference | Yes |

#### Enums

| Enum | Values |
|------|--------|
| `subscription_tier` | individual, team, enterprise |
| `subscription_status` | trial, active, cancelled, expired |
| `org_member_role` | org_admin, manager, member |
| `consent_type` | analysis, data_retention, sharing |
| `consent_status` | active, revoked |
| `job_status` | pending, processing, completed, failed, cancelled |
| `locale` | de, en |
| `platform_role` | superadmin, staff |
| `invitation_status` | pending, accepted, expired, cancelled |
| `invitation_type` | platform, organization |
| `form_status` | draft, published, archived |
| `form_visibility` | all_organizations, assigned |
| `form_completion_type` | thank_you, redirect |
| `form_step_display_mode` | progress_bar, tabs |

#### Supabase Clients

Three client configurations for different contexts:

```typescript
// Browser (Client Components):
import { createClient } from '@/lib/supabase/client'

// Server Components / Server Actions / Route Handlers:
import { createClient } from '@/lib/supabase/server'

// Superadmin operations (bypasses RLS):
import { createAdminClient } from '@/lib/supabase/admin'
```

#### Row Level Security (RLS)

RLS policies are defined in `supabase/migrations/`:
- `001_enable_rls.sql` - Enables RLS on all tables
- `002_tenant_isolation_policies.sql` - Tenant isolation via `organization_members` lookup

Apply these manually to your Supabase instance after running Drizzle migrations.

### Integrations

External services are configured via the **Integrations** admin page (`/admin/integrations`). Credentials are stored encrypted in the `integration_secrets` table using AES-256-GCM encryption.

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Supabase** | Database, Auth, Storage | URL, Anon Key, Service Role Key |
| **Resend** | Transactional emails | API Key, From Email, From Name |
| **n8n** | Analysis pipeline | Webhook URL, Health URL, Auth Header Name/Value |
| **Vercel** | Hosting (read-only) | Auto-detected from environment |

**ENV Fallback:** All services check DB-stored secrets first, then fall back to environment variables. This allows gradual migration from ENV vars to encrypted DB storage.

**Secret Caching:** Secrets are cached in-memory with a 5-minute TTL (`src/lib/crypto/secrets-cache.ts`) to avoid per-request DB queries and decryption. Cache is invalidated automatically when secrets are saved, rotated, or imported from env.

### n8n Integration

Analysis pipeline: Upload transcript -> Create job -> Trigger n8n webhook -> n8n processes -> Callback to `/api/webhooks/n8n/analysis-complete` -> Store report -> Notify user.

**Authentication:** Both outgoing requests (App -> n8n) and incoming callbacks (n8n -> App) use the same auth header (configurable name + value). Configure the identical header in your n8n workflow's Webhook Trigger node and HTTP Request node.

### Email System

Emails use configurable templates stored in the database with a customizable base layout.

**Base Layout** (`/admin/settings/email-layout`): Logo, colors (background, content, primary, text, links), footer text with placeholders (`{{platformName}}`, `{{currentYear}}`, `{{supportEmail}}`), and border radius.

**Templates** (`/admin/settings/emails`): Per-template subject and body in DE/EN with variable placeholders. Includes live preview, locale toggle, and test send functionality.

**Sending:** `sendTemplatedEmail()` loads template from DB, renders variables, wraps in configured layout, and sends via Resend (with DB secret + ENV fallback).

### Security

- **Secret Encryption:** All integration credentials are encrypted at rest using AES-256-GCM. The encryption key is stored in the `SECRETS_ENCRYPTION_KEY` environment variable (base64-encoded 32-byte key).
- **Tenant Isolation:** Every query for tenant data filters by `organization_id`. Supabase RLS policies provide an additional safety net.
- **RBAC:** Server-side role checks via `requirePlatformRole()`. Client-side checks are UX-only.
- **Audit Logging:** All sensitive operations are logged to the `audit_logs` table with actor, action, entity, and metadata.

### Form Builder

The platform includes a visual form builder for creating multi-step questionnaires (similar to Typeform/Fluentforms). Forms are versioned and rendered dynamically from a JSON schema.

**Architecture:**
- Form definitions stored in `forms` table with metadata (title, slug, visibility, completion config)
- Each form has versioned schemas stored as JSONB in `form_versions`
- Forms can be scoped to the platform or a specific organization
- Access control via `form_organization_assignments` (or `all_organizations` visibility)
- Submissions stored with reference to the exact form version used

**JSON Schema Structure:** `FormSchema > FormStep[] > FormField[]`

**11 Field Types:** text, textarea, number, email, phone, date, radio, checkbox, csat (1-10), rating (1-5 stars), hidden

**Features:**
- Conditional logic (show/hide fields based on other field values)
- Field validation (pattern, min/max, required)
- Multi-step forms with progress bar or tabs display
- Completion config (thank you page or redirect URL)
- Dynamic Zod validator generation from form schema for type-safe submission validation

**Visual Builder UI** (`/admin/forms`):
- 3-column drag-and-drop editor: field palette (left), sortable canvas (center), settings panel (right)
- @dnd-kit integration: drag field types from palette onto canvas, reorder fields via drag handle
- Multi-step management: add/remove/rename steps via tab bar, drag fields between steps
- Field settings tabs: General, Options (radio/checkbox), Validation, Conditional Logic, Hidden
- Auto-save with 3-second debounce (saves in-place, no version bump)
- Explicit save creates a new version; publish action available from toolbar
- Preview modal renders all field types in read-only mode
- State managed via `useReducer` with 12 action types (`BuilderAction` union)
- Forms list page with data table, status badges, duplicate/archive/delete actions

```typescript
import { createSubmissionValidator } from '@/lib/validations/forms'
import { getFormVersion, canOrganizationAccessForm } from '@/lib/forms'

// Check access
const canAccess = await canOrganizationAccessForm(formId, orgId)

// Get form version and validate submission
const version = await getFormVersion(formId)
const validator = createSubmissionValidator(version.schema as FormSchema)
const result = validator.safeParse(submissionData)
```

**Form Renderer** (`/forms/[slug]`):
- Two display modes: `progress_bar` (Typeform-style fullscreen with slide animations) and `tabs` (classic numbered tabs)
- 11 interactive field components with specialized UIs (CSAT color gradient, star ratings with hover, radio/checkbox button variants)
- Real-time conditional logic evaluation — hidden fields are not rendered, validated, or submitted
- Step-level validation with inline errors and smooth scroll to first error
- Keyboard navigation (Enter to advance) in progress bar mode
- Completion screen: animated checkmark (thank_you) or auto-redirect
- Dashboard card listing shows forms available to the organization with submission status

**Admin Submissions** (`/admin/forms/[formId]/submissions`):
- Stat cards: total submissions, this week, average fill duration
- Dynamic table columns generated from form schema field labels
- Filters: organization, date range, form version
- Submission detail dialog with full field display and metadata (duration, browser)
- Export: CSV and XLSX via `GET /api/admin/forms/[formId]/submissions/export?format=csv|xlsx`
- Export respects active filters; filename: `{slug}_submissions_{date}.csv|xlsx`

### File Storage
Supabase Storage with tenant-isolated paths: `transcripts/{org_id}/{job_id}/` and `reports/{org_id}/{report_id}/`.

### Internationalization
next-intl with App Router integration. Default locale: `de`. Supported: `['de', 'en']`. Translation files in `src/messages/`.

Translation namespaces: `common`, `nav`, `theme`, `auth` (incl. `auth.invite`), `errors`, `dashboard`, `analyses`, `team`, `settings`, `admin`.

```typescript
// In Server or Client Components:
import { useTranslations } from 'next-intl'
const t = useTranslations('dashboard')
// Usage: t('title'), t('stats.totalAnalyses')
```

### UI Layout
The dashboard uses a responsive app shell with:
- **Desktop:** Fixed 256px sidebar with navigation links
- **Mobile:** Collapsible sidebar via Sheet component (hamburger menu)
- **Header:** Mobile menu toggle, dark mode toggle (light/dark/system), user avatar dropdown
- **Dark mode:** Managed by next-themes with system preference detection

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm db:migrate` | Run Drizzle migrations |
| `pnpm db:generate` | Generate Drizzle migration files from schema |
| `pnpm db:push` | Push schema directly to database (dev only) |
| `pnpm db:studio` | Open Drizzle Studio (DB browser) |

## Project Structure

```
src/
├── app/
│   ├── [locale]/              # i18n dynamic segment
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (dashboard)/       # Authenticated app routes
│   │   ├── (superadmin)/      # Superadmin routes
│   │   ├── layout.tsx         # Locale layout with NextIntlClientProvider
│   │   └── page.tsx           # Redirects to dashboard
│   ├── api/                   # API routes
│   │   ├── auth/callback/     # Supabase auth callback (magic link, OAuth)
│   │   └── webhooks/          # n8n callback webhooks
│   └── layout.tsx             # Root layout (ThemeProvider)
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # AppShell, Sidebar, Header, AdminSidebar
│   ├── admin/                 # Admin components (StatCard, forms/, form-builder/)
│   ├── forms/                 # Form renderer, field components, completion
│   │   └── fields/            # 11 field render components + field-wrapper
│   ├── analyses/              # Analysis-specific components
│   └── shared/                # ThemeProvider, ThemeToggle
├── lib/
│   ├── supabase/              # Supabase clients (browser, server, admin, middleware)
│   ├── db/                    # Drizzle ORM (schema, migrations, client)
│   │   ├── schema/            # Table definitions and enums
│   │   └── index.ts           # Drizzle client instance
│   ├── i18n/                  # next-intl config
│   ├── auth/                  # Role definitions and permission helpers
│   ├── n8n/                   # Webhook trigger
│   ├── email/                 # Email sending with DB templates and configurable layout
│   ├── crypto/                # AES-256-GCM encryption and cached secret access
│   ├── settings/              # Platform settings (typed key-value store)
│   ├── audit/                 # Audit logging
│   ├── notifications/         # Notification creation and broadcast
│   ├── constants.ts           # App-wide constants
│   └── utils.ts               # Utility functions (cn, etc.)
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript type definitions
│   ├── database.ts            # Drizzle inferred types (Select + Insert)
│   ├── api.ts                 # API response types
│   └── index.ts               # Type re-exports
├── messages/                  # Translation files (de.json, en.json)
└── middleware.ts              # Locale routing, auth, subdomain resolution
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `DATABASE_URL` | Yes | PostgreSQL connection string for Drizzle ORM |
| `SECRETS_ENCRYPTION_KEY` | Yes | Base64-encoded 32-byte key for AES-256-GCM encryption of integration secrets |
| `NEXT_PUBLIC_APP_DOMAIN` | Yes | App domain (e.g., `localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Full app URL (e.g., `http://localhost:3000`) |
| `N8N_WEBHOOK_URL` | No | n8n webhook endpoint URL |
| `N8N_WEBHOOK_SECRET` | No | Shared secret for n8n authentication |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `RESEND_FROM_EMAIL` | No | Sender email address |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | No | Default locale (`de`) |

See `.env.example` for a complete template.

## Deployment

Deploy to Vercel:

1. Connect repository to Vercel
2. Set all environment variables in Vercel dashboard
3. Set the build command to `pnpm build`
4. Deploy

## Database Management

```bash
pnpm db:generate  # Generate Drizzle migration files from schema changes
pnpm db:migrate   # Run pending migrations against the database
pnpm db:push      # Push schema directly to database (dev only, no migration files)
pnpm db:studio    # Open Drizzle Studio (visual DB browser)
```

After running Drizzle migrations, apply RLS policies from `supabase/migrations/` to your Supabase instance.

## Contributing

### Commit Convention
Conventional Commits format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`, `perf`

Scopes: `auth`, `db`, `ui`, `api`, `middleware`, `i18n`, `n8n`, `storage`, `rbac`, `admin`, `config`, `deps`

### Branch Naming
`feature/xxx`, `fix/xxx`, `chore/xxx`
