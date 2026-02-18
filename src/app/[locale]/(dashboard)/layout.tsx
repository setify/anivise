import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { AppShell } from '@/components/layout/app-shell'
import { getImpersonation } from '@/lib/auth/impersonation'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, organizations, organizationMembers } from '@/lib/db/schema'
import { getSetting } from '@/lib/settings/platform'

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
  if (authUser) {
    const [dbUser] = await db
      .select({
        displayName: users.displayName,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1)

    if (dbUser) {
      userData = {
        displayName: dbUser.displayName || dbUser.fullName || null,
        email: dbUser.email,
        avatarUrl: dbUser.avatarUrl,
        orgRole: null,
      }
    }
  }

  // Resolve organization name and user role from slug (set by middleware)
  let orgName: string | null = impersonation?.orgName ?? null
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

        // Resolve user's role in this organization
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
          userData.orgRole = membership?.role ?? null
        }
      }
    }
  } else if (impersonation && authUser && userData) {
    // During impersonation, use the impersonation role
    userData.orgRole = impersonation.role ?? 'org_admin'
  }

  const logoUrl = await getSetting('platform.logo_url')

  return (
    <>
      {impersonation && (
        <ImpersonationBanner
          orgId={impersonation.orgId}
          orgName={impersonation.orgName}
          role={impersonation.role}
        />
      )}
      <AppShell user={userData} orgName={orgName} logoUrl={logoUrl || undefined}>{children}</AppShell>
    </>
  )
}
