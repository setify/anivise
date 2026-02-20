'use server'

import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { and, desc, like, gte, type SQL } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

export async function exportAuditLogs(params?: {
  action?: string
  period?: 'day' | 'week' | 'month' | 'all'
}): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    await requirePlatformRole('staff')

    const conditions: SQL[] = []

    if (params?.action && params.action !== 'all') {
      conditions.push(like(auditLogs.action, `${params.action}.%`))
    }

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
      .limit(10000) // Safety limit

    // Build CSV
    const headers = ['Timestamp', 'Action', 'Actor Email', 'Entity Type', 'Entity ID', 'Organization ID', 'IP Address', 'Metadata']
    const rows = logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.actorEmail,
      log.entityType,
      log.entityId ?? '',
      log.organizationId ?? '',
      log.ipAddress ?? '',
      log.metadata ? JSON.stringify(log.metadata) : '',
    ])

    // Escape CSV values
    function escapeCSV(value: string): string {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n')

    return { success: true, csv }
  } catch (error) {
    console.error('Failed to export audit logs:', error)
    return { success: false, error: 'Export failed' }
  }
}
