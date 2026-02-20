'use server'

import { db } from '@/lib/db'
import {
  organizationMembers,
  analysisJobs,
  analysisDossiers,
  auditLogs,
} from '@/lib/db/schema'
import { eq, and, count, desc } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

export async function getOrgUsageStats(organizationId: string) {
  await requirePlatformRole('staff')

  // Member counts
  const [memberCount] = await db
    .select({ value: count() })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, organizationId))

  // Analysis job counts by status
  const [totalJobs] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.organizationId, organizationId))

  const [completedJobs] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(
      and(
        eq(analysisJobs.organizationId, organizationId),
        eq(analysisJobs.status, 'completed')
      )
    )

  const [failedJobs] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(
      and(
        eq(analysisJobs.organizationId, organizationId),
        eq(analysisJobs.status, 'failed')
      )
    )

  const [processingJobs] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(
      and(
        eq(analysisJobs.organizationId, organizationId),
        eq(analysisJobs.status, 'processing')
      )
    )

  // Last activity - most recent audit log for this org
  const [lastActivity] = await db
    .select({ createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(eq(auditLogs.organizationId, organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1)

  // Dossier count for this org
  const [dossierCount] = await db
    .select({ value: count() })
    .from(analysisDossiers)
    .where(eq(analysisDossiers.organizationId, organizationId))

  return {
    members: memberCount?.value ?? 0,
    totalJobs: totalJobs?.value ?? 0,
    completedJobs: completedJobs?.value ?? 0,
    failedJobs: failedJobs?.value ?? 0,
    processingJobs: processingJobs?.value ?? 0,
    dossiers: dossierCount?.value ?? 0,
    lastActivity: lastActivity?.createdAt ?? null,
  }
}
