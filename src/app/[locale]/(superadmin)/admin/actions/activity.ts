'use server'

import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { and, count, desc, like, gte, type SQL } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

export async function getAuditLogs(params?: {
  action?: string
  period?: 'day' | 'week' | 'month' | 'all'
  offset?: number
  limit?: number
}) {
  await requirePlatformRole('staff')

  const pageLimit = params?.limit ?? 50
  const pageOffset = params?.offset ?? 0

  // Build conditions array
  const conditions: SQL[] = []

  // Filter by action category (prefix match: "org" matches "org.created", "org.deleted", etc.)
  if (params?.action && params.action !== 'all') {
    conditions.push(like(auditLogs.action, `${params.action}.%`))
  }

  // Filter by time period
  if (params?.period && params.period !== 'all') {
    const now = new Date()
    let since: Date
    switch (params.period) {
      case 'day':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        since = new Date(0)
    }
    conditions.push(gte(auditLogs.createdAt, since))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const logs = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageLimit)
    .offset(pageOffset)

  // Get total count with same filters for pagination
  const [countResult] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(whereClause)

  return {
    logs,
    total: countResult?.value ?? 0,
  }
}
