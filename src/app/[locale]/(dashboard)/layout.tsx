import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { AppShell } from '@/components/layout/app-shell'
import { getImpersonation } from '@/lib/auth/impersonation'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, organizations, organizationMembers } from '@/lib/db/schema'
import { getSetting } from '@/lib/settings/platform'
import { getOrgBranding } from '@/lib/branding/apply-branding'
import { hexToHsl } from '@/lib/branding/color-utils'
import { hasPlatformRole } from '@/lib/auth/roles'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const impersonation = await getImpersonation()

  // Fetch authenticated user data
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let userData: { displayName: string | null; email: string; avatarUrl: string | null; orgRole: string | null } | null = null
  let isSuperadmin = false

  if (authUser) {
    const [dbUser] = await db
      .select({
        displayName: users.displayName,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        platformRole: users.platformRole,
      })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1)

    if (dbUser) {
      isSuperadmin = hasPlatformRole(dbUser.platformRole, 'superadmin')
      userData = {
        displayName: dbUser.displayName || dbUser.fullName || null,
        email: dbUser.email,
        avatarUrl: dbUser.avatarUrl,
        orgRole: null,
      }
    }
  }

  // Resolve organization from subdomain header
  let orgName: string | null = impersonation?.orgName ?? null
  let orgId: string | null = null

  if (!orgName) {
    const headerStore = await headers()
    const orgSlug = headerStore.get('x-organization-slug')
    if (orgSlug) {
      const [org] = await db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(eq(organizations.slug, orgSlug))
        .limit(1)
      if (org) {
        orgName = org.name
        orgId = org.id

        if (authUser && userData) {
          const [membership] = await db
            .select({ role: organizationMembers.role })
            .from(organizationMembers)
            .where(
              and(
                eq(organizationMembers.userId, authUser.id),
                eq(organizationMembers.organizationId, org.id)
              )
            )
            .limit(1)

          // Superadmins get full org_admin access on any subdomain
          userData.orgRole = membership?.role ?? (isSuperadmin ? 'org_admin' : null)
        }
      }
    }
  } else if (impersonation) {
    orgId = impersonation.orgId
    if (userData) userData.orgRole = impersonation.role ?? 'org_admin'
  }

  const logoUrl = await getSetting('platform.logo_url')

  // Load org branding (CSS variables + favicon)
  let brandingCssVars: React.CSSProperties = {}
  let faviconUrl: string | null = null
  let orgLogoUrl: string | null = null

  if (orgId) {
    const branding = await getOrgBranding(orgId)
    faviconUrl = branding.faviconUrl
    orgLogoUrl = branding.logoUrl

    // Always apply colors: use stored values or fall back to Anivise defaults
    const primary = branding.primaryColor ?? '#6366f1'
    const accent = branding.accentColor ?? '#f59e0b'
    const bg = branding.backgroundColor ?? '#ffffff'
    const fg = branding.textColor ?? '#1e293b'

    brandingCssVars = {
      '--primary': hexToHsl(primary),
      '--accent': hexToHsl(accent),
      '--background': hexToHsl(bg),
      '--foreground': hexToHsl(fg),
    } as React.CSSProperties
  }

  return (
    <>
      {faviconUrl && (
        // eslint-disable-next-line @next/next/no-head-element
        <head>
          <link rel="icon" href={faviconUrl} />
        </head>
      )}
      {impersonation && (
        <ImpersonationBanner
          orgId={impersonation.orgId}
          orgName={impersonation.orgName}
          role={impersonation.role}
        />
      )}
      <div data-org-dashboard="" style={brandingCssVars}>
        <AppShell
          user={userData}
          orgName={orgName}
          logoUrl={orgLogoUrl || logoUrl || undefined}
        >
          {children}
        </AppShell>
      </div>
    </>
  )
}
