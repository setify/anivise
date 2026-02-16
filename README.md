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

The development server starts at [http://localhost:3000](http://localhost:3000).

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
- **Auth Provider:** Supabase Auth (email/password, magic link)
- **RBAC:** 4-tier hierarchy - `superadmin`, `org_admin`, `manager`, `member`
- Roles are stored in the `organization_members` junction table
- Superadmin is a flag on the `users` table (platform-wide scope)

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

### n8n Integration
Analysis pipeline: Upload transcript -> Create job -> Trigger n8n webhook -> n8n processes -> Callback to `/api/webhooks/n8n/analysis-complete` -> Store report -> Notify via Supabase Realtime.

### File Storage
Supabase Storage with tenant-isolated paths: `transcripts/{org_id}/{job_id}/` and `reports/{org_id}/{report_id}/`.

### Internationalization
next-intl with App Router integration. Default locale: `de`. Supported: `['de', 'en']`. Translation files in `src/messages/`.

Translation namespaces: `common`, `nav`, `theme`, `auth`, `dashboard`, `analyses`, `team`, `settings`, `admin`.

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
│   │   └── webhooks/          # n8n callback webhooks
│   └── layout.tsx             # Root layout (ThemeProvider)
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # AppShell, Sidebar, Header, AdminSidebar
│   ├── forms/                 # Reusable form components
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
│   ├── email/                 # Resend client
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
