'use server'

import { db } from '@/lib/db'
import { organizations, users } from '@/lib/db/schema'
import { count, isNull } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

export async function getPlatformStats() {
  await requirePlatformRole('staff')

  const [orgCount] = await db
    .select({ value: count() })
    .from(organizations)
    .where(isNull(organizations.deletedAt))

  const [userCount] = await db
    .select({ value: count() })
    .from(users)
    .where(isNull(users.deletedAt))

  return {
    totalOrganizations: orgCount?.value ?? 0,
    totalUsers: userCount?.value ?? 0,
  }
}
