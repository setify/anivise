import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema'
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

  let membership: { organizationId: string; role: string } | undefined

  if (orgSlug) {
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1)

    if (org) {
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
