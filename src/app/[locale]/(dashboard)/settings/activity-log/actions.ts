'use server'

import { db } from '@/lib/db'
import { auditLogs, users } from '@/lib/db/schema'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'

export async function getActivityLog(params?: {
  limit?: number
  offset?: number
  actionFilter?: string
  userFilter?: string
  dateFrom?: string
  dateTo?: string
}) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { logs: [], total: 0 }

  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  const conditions = [eq(auditLogs.organizationId, ctx.organizationId)]

  if (params?.actionFilter && params.actionFilter !== '__all__') {
    // Filter by action prefix (e.g. 'analysis' matches 'analysis.created', 'analysis.updated' etc.)
    conditions.push(sql`${auditLogs.action} LIKE ${params.actionFilter + '%'}`)
  }

  if (params?.userFilter && params.userFilter !== '__all__') {
    conditions.push(eq(auditLogs.actorId, params.userFilter))
  }

  if (params?.dateFrom) {
    conditions.push(gte(auditLogs.createdAt, new Date(params.dateFrom)))
  }

  if (params?.dateTo) {
    const endDate = new Date(params.dateTo)
    endDate.setHours(23, 59, 59, 999)
    conditions.push(lte(auditLogs.createdAt, endDate))
  }

  const where = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db
      .select({
        log: auditLogs,
        actorName: users.fullName,
        actorEmail: users.email,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.actorId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(where),
  ])

  return {
    logs: rows.map((r) => ({
      id: r.log.id,
      action: r.log.action,
      entityType: r.log.entityType,
      entityId: r.log.entityId,
      actorName: r.actorName ?? r.actorEmail,
      actorEmail: r.actorEmail,
      metadata: r.log.metadata as Record<string, unknown> | null,
      createdAt: r.log.createdAt,
    })),
    total: countResult[0]?.value ?? 0,
  }
}

export type ActivityLogRow = Awaited<ReturnType<typeof getActivityLog>>['logs'][number]

/** Get last N activities for the dashboard widget. */
export async function getRecentActivity(limit = 10) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      log: auditLogs,
      actorName: users.fullName,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.actorId, users.id))
    .where(eq(auditLogs.organizationId, ctx.organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)

  return rows.map((r) => ({
    id: r.log.id,
    action: r.log.action,
    entityType: r.log.entityType,
    actorName: r.actorName ?? r.actorEmail,
    createdAt: r.log.createdAt,
  }))
}

export type RecentActivityRow = Awaited<ReturnType<typeof getRecentActivity>>[number]
