'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { analysisJobs, organizations } from '@/lib/db/schema'
import { eq, and, count, desc, sql, type SQL } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'

export async function getAnalysisJobs(params?: {
  status?: string
  organizationId?: string
  offset?: number
  limit?: number
}) {
  await requirePlatformRole('staff')

  const pageLimit = params?.limit ?? 50
  const pageOffset = params?.offset ?? 0

  const conditions: SQL[] = []

  if (params?.status && params.status !== 'all') {
    conditions.push(eq(analysisJobs.status, params.status as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'))
  }

  if (params?.organizationId && params.organizationId !== 'all') {
    conditions.push(eq(analysisJobs.organizationId, params.organizationId))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const jobs = await db
    .select({
      id: analysisJobs.id,
      organizationId: analysisJobs.organizationId,
      subjectId: analysisJobs.subjectId,
      requestedBy: analysisJobs.requestedBy,
      status: analysisJobs.status,
      errorMessage: analysisJobs.errorMessage,
      n8nWebhookTriggeredAt: analysisJobs.n8nWebhookTriggeredAt,
      n8nCallbackReceivedAt: analysisJobs.n8nCallbackReceivedAt,
      createdAt: analysisJobs.createdAt,
      updatedAt: analysisJobs.updatedAt,
      orgName: organizations.name,
      orgSlug: organizations.slug,
    })
    .from(analysisJobs)
    .leftJoin(organizations, eq(analysisJobs.organizationId, organizations.id))
    .where(whereClause)
    .orderBy(desc(analysisJobs.createdAt))
    .limit(pageLimit)
    .offset(pageOffset)

  const [countResult] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(whereClause)

  return { jobs, total: countResult?.value ?? 0 }
}

export async function getAnalysisJobStats() {
  await requirePlatformRole('staff')

  const [pending] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'pending'))

  const [processing] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'processing'))

  const [completed] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'completed'))

  const [failed] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'failed'))

  const [cancelled] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'cancelled'))

  const [total] = await db
    .select({ value: count() })
    .from(analysisJobs)

  return {
    pending: pending?.value ?? 0,
    processing: processing?.value ?? 0,
    completed: completed?.value ?? 0,
    failed: failed?.value ?? 0,
    cancelled: cancelled?.value ?? 0,
    total: total?.value ?? 0,
  }
}

export async function cancelAnalysisJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [job] = await db
      .select({ status: analysisJobs.status, organizationId: analysisJobs.organizationId })
      .from(analysisJobs)
      .where(eq(analysisJobs.id, jobId))
      .limit(1)

    if (!job) {
      return { success: false, error: 'Job not found' }
    }

    if (job.status !== 'pending' && job.status !== 'processing') {
      return { success: false, error: `Cannot cancel job with status: ${job.status}` }
    }

    // Atomically update only if status is still cancellable (prevents race conditions)
    const [updated] = await db
      .update(analysisJobs)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(
        and(
          eq(analysisJobs.id, jobId),
          sql`${analysisJobs.status} IN ('pending', 'processing')`
        )
      )
      .returning({ id: analysisJobs.id, organizationId: analysisJobs.organizationId })

    if (!updated) {
      return { success: false, error: 'Job cannot be cancelled (status may have changed)' }
    }

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'analysis_job.cancelled',
      entityType: 'analysis_job',
      entityId: jobId,
      organizationId: updated.organizationId,
    })

    revalidatePath('/admin/jobs')
    return { success: true }
  } catch (error) {
    console.error('Failed to cancel analysis job:', error)
    return { success: false, error: 'Failed to cancel job' }
  }
}

export async function retryAnalysisJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [job] = await db
      .select({
        status: analysisJobs.status,
        organizationId: analysisJobs.organizationId,
        transcriptStoragePath: analysisJobs.transcriptStoragePath,
      })
      .from(analysisJobs)
      .where(eq(analysisJobs.id, jobId))
      .limit(1)

    if (!job) {
      return { success: false, error: 'Job not found' }
    }

    if (job.status !== 'failed' && job.status !== 'cancelled') {
      return { success: false, error: `Cannot retry job with status: ${job.status}` }
    }

    // Atomically reset job only if status is still retryable (prevents race conditions)
    const [updated] = await db
      .update(analysisJobs)
      .set({
        status: 'pending',
        errorMessage: null,
        n8nWebhookTriggeredAt: null,
        n8nCallbackReceivedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(analysisJobs.id, jobId),
          sql`${analysisJobs.status} IN ('failed', 'cancelled')`
        )
      )
      .returning({ id: analysisJobs.id, organizationId: analysisJobs.organizationId })

    if (!updated) {
      return { success: false, error: 'Job cannot be retried (status may have changed)' }
    }

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'analysis_job.retried',
      entityType: 'analysis_job',
      entityId: jobId,
      organizationId: updated.organizationId,
    })

    // TODO: Re-trigger n8n webhook when integration is fully wired
    // await triggerN8nWebhook({ jobId, organizationId: job.organizationId, ... })

    revalidatePath('/admin/jobs')
    return { success: true }
  } catch (error) {
    console.error('Failed to retry analysis job:', error)
    return { success: false, error: 'Failed to retry job' }
  }
}

export async function checkN8nHealthAction() {
  await requirePlatformRole('staff')

  const { checkN8nHealth } = await import('@/lib/n8n/trigger')
  return checkN8nHealth()
}
