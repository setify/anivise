import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hasPlatformRole, type PlatformRole } from './roles'

/**
 * Server-side guard that verifies the current user has the required platform role.
 * Redirects to login if not authenticated, or to dashboard if insufficient role.
 * Returns the authenticated user with their platform role.
 */
export async function requirePlatformRole(requiredRole: PlatformRole = 'staff') {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const [dbUser] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      phone: users.phone,
      timezone: users.timezone,
      avatarUrl: users.avatarUrl,
      avatarStoragePath: users.avatarStoragePath,
      platformRole: users.platformRole,
      preferredLocale: users.preferredLocale,
    })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1)

  if (!dbUser || !hasPlatformRole(dbUser.platformRole, requiredRole)) {
    redirect('/dashboard')
  }

  return dbUser
}
