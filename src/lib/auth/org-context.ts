import { db } from '@/lib/db'
import { organizations, organizationMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export interface OrgContext {
  userId: string
  email: string
  organizationId: string
  role: string
}

/**
 * Resolve the current org context for the authenticated user.
 *
 * Resolution order:
 * 1. x-organization-slug header (set by middleware from subdomain or ?org param)
 *    → looks up org by slug, then finds membership for that specific org
 * 2. Fallback: user's first membership (dev convenience when no subdomain)
 *
 * Returns null if user is not authenticated or has no membership.
 * Redirects to /login if session is missing.
 */
export async function getCurrentOrgContext(
  requiredRole?: 'org_admin' | 'manager'
): Promise<OrgContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const headerStore = await headers()
  const orgSlug = headerStore.get('x-organization-slug')

  // Check if the user is a superadmin (platform-wide access)
  const [dbUser] = await db
    .select({ platformRole: users.platformRole })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  const isSuperadmin = dbUser?.platformRole === 'superadmin'

  let resolvedOrgId: string | null = null
  let membership: { organizationId: string; role: string } | undefined

  if (orgSlug) {
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1)

    if (org) {
      resolvedOrgId = org.id

      const [m] = await db
        .select({
          organizationId: organizationMembers.organizationId,
          role: organizationMembers.role,
        })
        .from(organizationMembers)
        .where(and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.organizationId, org.id),
        ))
        .limit(1)
      membership = m

      // Superadmin bypass: access any org without being a member
      if (!membership && isSuperadmin) {
        return {
          userId: user.id,
          email: user.email ?? '',
          organizationId: org.id,
          role: 'org_admin',
        }
      }
    }
  }

  // Fallback: any membership (useful in dev without subdomain)
  if (!membership) {
    const [m] = await db
      .select({
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, user.id))
      .limit(1)
    membership = m
  }

  if (!membership) return null

  if (requiredRole) {
    const hierarchy: Record<string, number> = { org_admin: 2, manager: 1, member: 0 }
    const required = hierarchy[requiredRole] ?? 0
    const actual = hierarchy[membership.role] ?? -1
    if (actual < required) return null
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    organizationId: membership.organizationId,
    role: membership.role,
  }
}
