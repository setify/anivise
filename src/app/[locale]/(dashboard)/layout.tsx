import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { AppShell } from '@/components/layout/app-shell'
import { getImpersonation } from '@/lib/auth/impersonation'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, organizations } from '@/lib/db/schema'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const impersonation = await getImpersonation()

  // Fetch authenticated user data
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let userData: { displayName: string | null; email: string; avatarUrl: string | null } | null = null
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
      }
    }
  }

  // Resolve organization name from slug (set by middleware)
  let orgName: string | null = impersonation?.orgName ?? null
  if (!orgName) {
    const headerStore = await headers()
    const orgSlug = headerStore.get('x-organization-slug')
    if (orgSlug) {
      const [org] = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.slug, orgSlug))
        .limit(1)
      if (org) {
        orgName = org.name
      }
    }
  }

  return (
    <>
      {impersonation && (
        <ImpersonationBanner
          orgId={impersonation.orgId}
          orgName={impersonation.orgName}
          role={impersonation.role}
        />
      )}
      <AppShell user={userData} orgName={orgName}>{children}</AppShell>
    </>
  )
}
