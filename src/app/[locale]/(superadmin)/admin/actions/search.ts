'use server'

import { db } from '@/lib/db'
import { users, organizations, analysisJobs } from '@/lib/db/schema'
import { isNull, ilike, or, desc, and } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

export interface SearchResult {
  id: string
  type: 'organization' | 'user' | 'job'
  title: string
  subtitle: string
  href: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await requirePlatformRole('staff')

  if (!query || query.trim().length < 2) return []

  const search = `%${query.trim()}%`
  const results: SearchResult[] = []

  const [orgResults, userResults, jobResults] = await Promise.all([
    // Search organizations
    db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
      })
      .from(organizations)
      .where(
        and(
          isNull(organizations.deletedAt),
          or(
            ilike(organizations.name, search),
            ilike(organizations.slug, search)
          )
        )
      )
      .orderBy(desc(organizations.createdAt))
      .limit(5),

    // Search users
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        fullName: users.fullName,
      })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          or(
            ilike(users.email, search),
            ilike(users.fullName, search),
            ilike(users.displayName, search),
            ilike(users.firstName, search),
            ilike(users.lastName, search)
          )
        )
      )
      .orderBy(desc(users.createdAt))
      .limit(5),

    // Search jobs by ID prefix
    db
      .select({
        id: analysisJobs.id,
        status: analysisJobs.status,
        createdAt: analysisJobs.createdAt,
      })
      .from(analysisJobs)
      .where(ilike(analysisJobs.id, search))
      .orderBy(desc(analysisJobs.createdAt))
      .limit(5),
  ])

  for (const org of orgResults) {
    results.push({
      id: org.id,
      type: 'organization',
      title: org.name,
      subtitle: org.slug,
      href: `/admin/organizations/${org.id}`,
    })
  }

  for (const user of userResults) {
    results.push({
      id: user.id,
      type: 'user',
      title: user.displayName || user.fullName || user.email,
      subtitle: user.email,
      href: `/admin/users?highlight=${user.id}`,
    })
  }

  for (const job of jobResults) {
    results.push({
      id: job.id,
      type: 'job',
      title: `Job ${job.id.slice(0, 8)}...`,
      subtitle: job.status,
      href: `/admin/jobs?highlight=${job.id}`,
    })
  }

  return results
}
