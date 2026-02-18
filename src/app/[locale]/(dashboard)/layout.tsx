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
  let brandingStyles: Record<string, string> = {}
  let faviconUrl: string | null = null
  let orgLogoUrl: string | null = null

  if (orgId) {
    const branding = await getOrgBranding(orgId)
    faviconUrl = branding.faviconUrl
    orgLogoUrl = branding.logoUrl

    if (branding.primaryColor) {
      brandingStyles = {
        '--brand-primary': hexToHsl(branding.primaryColor),
        ...(branding.accentColor ? { '--brand-accent': hexToHsl(branding.accentColor) } : {}),
        ...(branding.backgroundColor ? { '--brand-background': hexToHsl(branding.backgroundColor) } : {}),
        ...(branding.textColor ? { '--brand-foreground': hexToHsl(branding.textColor) } : {}),
      }
    }
  }

  const hasBranding = Object.keys(brandingStyles).length > 0

  return (
    <>
      {faviconUrl && (
        // eslint-disable-next-line @next/next/no-head-element
        <head>
          <link rel="icon" href={faviconUrl} />
        </head>
      )}
      {hasBranding && (
        <style>{`
          [data-org-dashboard] {
            --primary: ${brandingStyles['--brand-primary'] ?? 'var(--primary)'};
            ${brandingStyles['--brand-accent'] ? `--accent: ${brandingStyles['--brand-accent']};` : ''}
            ${brandingStyles['--brand-background'] ? `--background: ${brandingStyles['--brand-background']};` : ''}
            ${brandingStyles['--brand-foreground'] ? `--foreground: ${brandingStyles['--brand-foreground']};` : ''}
          }
        `}</style>
      )}
      {impersonation && (
        <ImpersonationBanner
          orgId={impersonation.orgId}
          orgName={impersonation.orgName}
          role={impersonation.role}
        />
      )}
      <div data-org-dashboard="">
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
