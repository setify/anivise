import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analysisJobs, reports } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod/v4'
import { createNotification } from '@/lib/notifications/create'

const callbackSchema = z.object({
  jobId: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum(['completed', 'failed']),
  reportData: z.record(z.string(), z.unknown()).optional(),
  reportVersion: z.string().optional(),
  errorMessage: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // Validate the shared secret
  const secret = request.headers.get('X-N8N-Secret')
  if (!secret || secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid secret' } },
      { status: 401 }
    )
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } },
      { status: 400 }
    )
  }

  const parsed = callbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } },
      { status: 400 }
    )
  }

  const { jobId, organizationId, status, reportData, reportVersion, errorMessage } = parsed.data

  // Verify job exists and belongs to claimed org
  const [job] = await db
    .select()
    .from(analysisJobs)
    .where(
      and(
        eq(analysisJobs.id, jobId),
        eq(analysisJobs.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!job) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } },
      { status: 404 }
    )
  }

  // Update job status
  await db
    .update(analysisJobs)
    .set({
      status,
      n8nCallbackReceivedAt: new Date(),
      errorMessage: errorMessage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(analysisJobs.id, jobId))

  // If completed, store the report
  if (status === 'completed' && reportData) {
    await db.insert(reports).values({
      organizationId,
      analysisJobId: jobId,
      subjectId: job.subjectId,
      reportData,
      reportVersion: reportVersion ?? null,
      generatedAt: new Date(),
    })

    await createNotification({
      recipientId: job.requestedBy,
      type: 'analysis.completed',
      title: 'Analysis completed',
      body: `Job ${jobId.slice(0, 8)}... has finished successfully.`,
    })
  }

  if (status === 'failed') {
    await createNotification({
      recipientId: job.requestedBy,
      type: 'analysis.failed',
      title: 'Analysis failed',
      body: errorMessage ?? `Job ${jobId.slice(0, 8)}... failed.`,
    })

    // Also notify superadmins
    await createNotification({
      recipientId: 'all_superadmins',
      type: 'analysis.failed',
      title: 'Analysis job failed',
      body: `Job ${jobId.slice(0, 8)}... in org ${organizationId.slice(0, 8)}... failed: ${errorMessage ?? 'Unknown error'}`,
    })
  }

  return NextResponse.json({ success: true })
}
