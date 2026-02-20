import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { AppShell } from '@/components/layout/app-shell'
import { getImpersonation } from '@/lib/auth/impersonation'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'
import { DynamicFavicon } from '@/components/shared/dynamic-favicon'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, organizations, organizationMembers } from '@/lib/db/schema'
import { getSetting } from '@/lib/settings/platform'
import { getOrgBranding } from '@/lib/branding/apply-branding'
import { getContrastForeground } from '@/lib/branding/color-utils'
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

    // Only apply custom colors if the org has saved branding
    // Hex values are valid CSS colors and can be used directly in CSS variables
    // Foreground colors are auto-calculated for contrast
    if (branding.primaryColor) {
      brandingCssVars = {
        '--primary': branding.primaryColor,
        '--primary-foreground': getContrastForeground(branding.primaryColor),
        ...(branding.accentColor
          ? {
              '--accent': branding.accentColor,
              '--accent-foreground': getContrastForeground(branding.accentColor),
            }
          : {}),
        ...(branding.backgroundColor ? { '--background': branding.backgroundColor } : {}),
        ...(branding.textColor ? { '--foreground': branding.textColor } : {}),
      } as React.CSSProperties
    }
  }

  return (
    <>
      {faviconUrl && <DynamicFavicon href={faviconUrl} />}
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
