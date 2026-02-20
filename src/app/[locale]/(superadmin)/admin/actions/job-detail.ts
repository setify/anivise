'use server'

import { db } from '@/lib/db'
import { analysisJobs, organizations, analysisSubjects, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

export async function getAnalysisJobDetail(jobId: string) {
  await requirePlatformRole('staff')

  const [job] = await db
    .select({
      id: analysisJobs.id,
      organizationId: analysisJobs.organizationId,
      subjectId: analysisJobs.subjectId,
      requestedBy: analysisJobs.requestedBy,
      status: analysisJobs.status,
      errorMessage: analysisJobs.errorMessage,
      metadata: analysisJobs.metadata,
      isTest: analysisJobs.isTest,
      transcriptStoragePath: analysisJobs.transcriptStoragePath,
      n8nWebhookTriggeredAt: analysisJobs.n8nWebhookTriggeredAt,
      n8nCallbackReceivedAt: analysisJobs.n8nCallbackReceivedAt,
      createdAt: analysisJobs.createdAt,
      updatedAt: analysisJobs.updatedAt,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      subjectName: analysisSubjects.fullName,
      subjectEmail: analysisSubjects.email,
      requestedByEmail: users.email,
      requestedByName: users.displayName,
    })
    .from(analysisJobs)
    .leftJoin(organizations, eq(analysisJobs.organizationId, organizations.id))
    .leftJoin(analysisSubjects, eq(analysisJobs.subjectId, analysisSubjects.id))
    .leftJoin(users, eq(analysisJobs.requestedBy, users.id))
    .where(eq(analysisJobs.id, jobId))
    .limit(1)

  return job ?? null
}
