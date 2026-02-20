'use server'

import { db } from '@/lib/db'
import { users, organizationMembers, organizations } from '@/lib/db/schema'
import { eq, isNull, ilike, or, desc, and, inArray } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

export async function getAllPlatformUsers(query?: string) {
  await requirePlatformRole('staff')

  const conditions = [isNull(users.deletedAt)]

  if (query && query.trim()) {
    const search = `%${query.trim()}%`
    conditions.push(
      or(
        ilike(users.email, search),
        ilike(users.fullName, search),
        ilike(users.displayName, search),
        ilike(users.firstName, search),
        ilike(users.lastName, search),
      )!
    )
  }

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      platformRole: users.platformRole,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt))
    .limit(200)

  const userIds = allUsers.map((u) => u.id)
  if (userIds.length === 0) return []

  const memberships = await db
    .select({
      userId: organizationMembers.userId,
      orgId: organizationMembers.organizationId,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      role: organizationMembers.role,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizationMembers.organizationId, organizations.id)
    )
    .where(inArray(organizationMembers.userId, userIds))

  const membershipMap = new Map<
    string,
    {
      userId: string
      orgId: string
      orgName: string
      orgSlug: string
      role: string
      status: string
    }[]
  >()
  for (const m of memberships) {
    const existing = membershipMap.get(m.userId) || []
    existing.push(m)
    membershipMap.set(m.userId, existing)
  }

  return allUsers.map((u) => ({
    ...u,
    organizations: membershipMap.get(u.id) || [],
  }))
}
