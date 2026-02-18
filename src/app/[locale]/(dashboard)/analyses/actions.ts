'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  analyses,
  analysisShares,
  analysisComments,
  analysisRecordings,
  employees,
  users,
  organizationMembers,
  notifications,
} from '@/lib/db/schema'
import { eq, and, or, isNull, desc, count } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { logAudit } from '@/lib/audit/log'
import { sendTemplatedEmail } from '@/lib/email/send'
import { getIntegrationSecret } from '@/lib/crypto/secrets'
import type { AnalysisStatus } from '@/types/database'

// ─── Query Helpers ──────────────────────────────────────────────────

export async function getAnalyses() {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      analysis: analyses,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      managerFullName: users.fullName,
      managerEmail: users.email,
    })
    .from(analyses)
    .innerJoin(employees, eq(analyses.employeeId, employees.id))
    .innerJoin(users, eq(analyses.managerId, users.id))
    .where(
      and(
        eq(analyses.organizationId, ctx.organizationId),
        isNull(analyses.deletedAt)
      )
    )
    .orderBy(desc(analyses.updatedAt))

  // Role-based filtering: managers see own + shared
  if (ctx.role === 'manager') {
    const shareRows = await db
      .select({ analysisId: analysisShares.analysisId })
      .from(analysisShares)
      .where(eq(analysisShares.sharedWithUserId, ctx.userId))

    const sharedIds = new Set(shareRows.map((r) => r.analysisId))

    return rows
      .filter(
        (r) =>
          r.analysis.managerId === ctx.userId || sharedIds.has(r.analysis.id)
      )
      .map(mapAnalysisRow)
  }

  // org_admin sees all
  return rows.map(mapAnalysisRow)
}

function mapAnalysisRow(r: {
  analysis: typeof analyses.$inferSelect
  employeeFirstName: string
  employeeLastName: string
  managerFullName: string | null
  managerEmail: string
}) {
  return {
    id: r.analysis.id,
    name: r.analysis.name,
    employeeId: r.analysis.employeeId,
    employeeName: `${r.employeeFirstName} ${r.employeeLastName}`,
    managerId: r.analysis.managerId,
    managerName: r.managerFullName ?? r.managerEmail,
    status: r.analysis.status,
    archived: r.analysis.archived,
    createdAt: r.analysis.createdAt,
    updatedAt: r.analysis.updatedAt,
  }
}

export type AnalysisRow = Awaited<ReturnType<typeof getAnalyses>>[number]

export async function getAnalysisById(id: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return null

  const [row] = await db
    .select({
      analysis: analyses,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      employeeEmail: employees.email,
      employeePosition: employees.position,
      employeeAvatarUrl: employees.avatarUrl,
      managerFullName: users.fullName,
      managerEmail: users.email,
    })
    .from(analyses)
    .innerJoin(employees, eq(analyses.employeeId, employees.id))
    .innerJoin(users, eq(analyses.managerId, users.id))
    .where(
      and(
        eq(analyses.id, id),
        eq(analyses.organizationId, ctx.organizationId),
        isNull(analyses.deletedAt)
      )
    )
    .limit(1)

  if (!row) return null

  // Access check for managers
  if (ctx.role === 'manager' && row.analysis.managerId !== ctx.userId) {
    const [share] = await db
      .select()
      .from(analysisShares)
      .where(
        and(
          eq(analysisShares.analysisId, id),
          eq(analysisShares.sharedWithUserId, ctx.userId)
        )
      )
      .limit(1)
    if (!share) return null
  }

  return {
    id: row.analysis.id,
    name: row.analysis.name,
    status: row.analysis.status,
    archived: row.analysis.archived,
    employeeId: row.analysis.employeeId,
    employeeName: `${row.employeeFirstName} ${row.employeeLastName}`,
    employeeEmail: row.employeeEmail,
    employeePosition: row.employeePosition,
    employeeAvatarUrl: row.employeeAvatarUrl,
    managerId: row.analysis.managerId,
    managerName: row.managerFullName ?? row.managerEmail,
    createdBy: row.analysis.createdBy,
    createdAt: row.analysis.createdAt,
    updatedAt: row.analysis.updatedAt,
  }
}

export type AnalysisDetail = NonNullable<Awaited<ReturnType<typeof getAnalysisById>>>

export async function getAnalysisComments(analysisId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      comment: analysisComments,
      authorFullName: users.fullName,
      authorEmail: users.email,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(analysisComments)
    .innerJoin(users, eq(analysisComments.authorId, users.id))
    .where(eq(analysisComments.analysisId, analysisId))
    .orderBy(desc(analysisComments.createdAt))

  return rows.map((r) => ({
    id: r.comment.id,
    content: r.comment.content,
    authorId: r.comment.authorId,
    authorName: r.authorFullName ?? r.authorEmail,
    authorAvatarUrl: r.authorAvatarUrl,
    createdAt: r.comment.createdAt,
    updatedAt: r.comment.updatedAt,
    isOwn: r.comment.authorId === ctx.userId,
  }))
}

export type AnalysisCommentRow = Awaited<ReturnType<typeof getAnalysisComments>>[number]

export async function getAnalysisShares(analysisId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      share: analysisShares,
      userName: users.fullName,
      userEmail: users.email,
      userAvatarUrl: users.avatarUrl,
    })
    .from(analysisShares)
    .innerJoin(users, eq(analysisShares.sharedWithUserId, users.id))
    .where(eq(analysisShares.analysisId, analysisId))

  return rows.map((r) => ({
    id: r.share.id,
    userId: r.share.sharedWithUserId,
    userName: r.userName ?? r.userEmail,
    userEmail: r.userEmail,
    userAvatarUrl: r.userAvatarUrl,
    createdAt: r.share.createdAt,
  }))
}

export type AnalysisShareRow = Awaited<ReturnType<typeof getAnalysisShares>>[number]

/** Get managers in the org (for create dialog + share + reassign) */
export async function getOrgManagers() {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      fullName: users.fullName,
      email: users.email,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(
      and(
        eq(organizationMembers.organizationId, ctx.organizationId),
        eq(organizationMembers.status, 'active'),
        or(
          eq(organizationMembers.role, 'org_admin'),
          eq(organizationMembers.role, 'manager')
        )
      )
    )
    .orderBy(users.fullName)

  return rows.map((r) => ({
    userId: r.userId,
    name: r.fullName ?? r.email,
    email: r.email,
    role: r.role,
    isCurrentUser: r.userId === ctx.userId,
  }))
}

export type OrgManager = Awaited<ReturnType<typeof getOrgManagers>>[number]

/** Get employees for the create dialog */
export async function getActiveEmployees() {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      position: employees.position,
    })
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, ctx.organizationId),
        eq(employees.status, 'active')
      )
    )
    .orderBy(employees.lastName, employees.firstName)

  return rows.map((r) => ({
    id: r.id,
    name: `${r.firstName} ${r.lastName}`,
    position: r.position,
  }))
}

export type ActiveEmployee = Awaited<ReturnType<typeof getActiveEmployees>>[number]

// ─── Mutations ──────────────────────────────────────────────────────

export async function createAnalysis(formData: FormData) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const employeeId = formData.get('employeeId') as string
  let managerId = formData.get('managerId') as string | null

  // Managers are always assigned to themselves
  if (ctx.role === 'manager') {
    managerId = ctx.userId
  }
  if (!managerId) managerId = ctx.userId

  // Get employee name for auto-generated analysis name
  const [emp] = await db
    .select({ firstName: employees.firstName, lastName: employees.lastName })
    .from(employees)
    .where(
      and(eq(employees.id, employeeId), eq(employees.organizationId, ctx.organizationId))
    )
    .limit(1)

  if (!emp) return { success: false, error: 'employee_not_found' }

  const now = new Date()
  const dateStr = now.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const name = `Analyse - ${emp.firstName} ${emp.lastName} - ${dateStr}`

  const [analysis] = await db
    .insert(analyses)
    .values({
      organizationId: ctx.organizationId,
      name,
      employeeId,
      managerId,
      createdBy: ctx.userId,
    })
    .returning()

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'analysis.created',
    entityType: 'analysis',
    entityId: analysis.id,
    organizationId: ctx.organizationId,
    metadata: { employeeId, managerId },
  })

  revalidatePath('/analyses')
  return { success: true, analysisId: analysis.id }
}

export async function updateAnalysis(formData: FormData) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string

  const [existing] = await db
    .select()
    .from(analyses)
    .where(
      and(eq(analyses.id, id), eq(analyses.organizationId, ctx.organizationId), isNull(analyses.deletedAt))
    )
    .limit(1)
  if (!existing) return { success: false, error: 'not_found' }

  await db
    .update(analyses)
    .set({ name, updatedAt: new Date() })
    .where(eq(analyses.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'analysis.updated',
    entityType: 'analysis',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/analyses')
  revalidatePath(`/analyses/${id}`)
  return { success: true }
}

export async function changeAnalysisStatus(id: string, status: AnalysisStatus) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [existing] = await db
    .select()
    .from(analyses)
    .where(
      and(eq(analyses.id, id), eq(analyses.organizationId, ctx.organizationId), isNull(analyses.deletedAt))
    )
    .limit(1)
  if (!existing) return { success: false, error: 'not_found' }

  await db
    .update(analyses)
    .set({ status, updatedAt: new Date() })
    .where(eq(analyses.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'analysis.status_changed',
    entityType: 'analysis',
    entityId: id,
    organizationId: ctx.organizationId,
    metadata: { oldStatus: existing.status, newStatus: status },
  })

  revalidatePath('/analyses')
  revalidatePath(`/analyses/${id}`)
  return { success: true }
}

export async function toggleArchiveAnalysis(id: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [existing] = await db
    .select()
    .from(analyses)
    .where(
      and(eq(analyses.id, id), eq(analyses.organizationId, ctx.organizationId), isNull(analyses.deletedAt))
    )
    .limit(1)
  if (!existing) return { success: false, error: 'not_found' }

  const archived = !existing.archived

  await db
    .update(analyses)
    .set({ archived, updatedAt: new Date() })
    .where(eq(analyses.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: archived ? 'analysis.archived' : 'analysis.unarchived',
    entityType: 'analysis',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/analyses')
  revalidatePath(`/analyses/${id}`)
  return { success: true }
}

export async function deleteAnalysis(id: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [existing] = await db
    .select()
    .from(analyses)
    .where(
      and(eq(analyses.id, id), eq(analyses.organizationId, ctx.organizationId), isNull(analyses.deletedAt))
    )
    .limit(1)
  if (!existing) return { success: false, error: 'not_found' }

  await db
    .update(analyses)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(analyses.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'analysis.deleted',
    entityType: 'analysis',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/analyses')
  return { success: true }
}

export async function changeAnalysisManager(id: string, newManagerId: string) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [existing] = await db
    .select()
    .from(analyses)
    .where(
      and(eq(analyses.id, id), eq(analyses.organizationId, ctx.organizationId), isNull(analyses.deletedAt))
    )
    .limit(1)
  if (!existing) return { success: false, error: 'not_found' }

  await db
    .update(analyses)
    .set({ managerId: newManagerId, updatedAt: new Date() })
    .where(eq(analyses.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'analysis.manager_changed',
    entityType: 'analysis',
    entityId: id,
    organizationId: ctx.organizationId,
    metadata: { oldManagerId: existing.managerId, newManagerId },
  })

  revalidatePath('/analyses')
  revalidatePath(`/analyses/${id}`)
  return { success: true }
}

// ─── Sharing ────────────────────────────────────────────────────────

export async function shareAnalysis(analysisId: string, userId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  // Verify analysis belongs to org
  const [analysis] = await db
    .select()
    .from(analyses)
    .where(
      and(eq(analyses.id, analysisId), eq(analyses.organizationId, ctx.organizationId))
    )
    .limit(1)
  if (!analysis) return { success: false, error: 'not_found' }

  // Check not already shared
  const [existing] = await db
    .select()
    .from(analysisShares)
    .where(
      and(eq(analysisShares.analysisId, analysisId), eq(analysisShares.sharedWithUserId, userId))
    )
    .limit(1)
  if (existing) return { success: false, error: 'already_shared' }

  await db.insert(analysisShares).values({
    analysisId,
    sharedWithUserId: userId,
    sharedByUserId: ctx.userId,
  })

  // In-App notification
  const [recipientUser] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  await db.insert(notifications).values({
    recipientId: userId,
    type: 'analysis_shared',
    title: 'Analyse freigegeben',
    body: `Eine Analyse wurde mit Ihnen geteilt: ${analysis.name}`,
    link: `/analyses/${analysisId}`,
  })

  // Email notification
  if (recipientUser) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    await sendTemplatedEmail({
      to: recipientUser.email,
      templateSlug: 'analysis-shared',
      locale: 'de',
      variables: {
        analysisName: analysis.name,
        analysisLink: `${appUrl}/de/analyses/${analysisId}`,
        sharedBy: ctx.email,
      },
    }).catch(() => {
      // Email failure shouldn't block the share
    })
  }

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'analysis.shared',
    entityType: 'analysis',
    entityId: analysisId,
    organizationId: ctx.organizationId,
    metadata: { sharedWithUserId: userId },
  })

  revalidatePath(`/analyses/${analysisId}`)
  return { success: true }
}

export async function unshareAnalysis(shareId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [share] = await db
    .select()
    .from(analysisShares)
    .where(eq(analysisShares.id, shareId))
    .limit(1)
  if (!share) return { success: false, error: 'not_found' }

  await db.delete(analysisShares).where(eq(analysisShares.id, shareId))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'analysis.unshared',
    entityType: 'analysis',
    entityId: share.analysisId,
    organizationId: ctx.organizationId,
    metadata: { removedUserId: share.sharedWithUserId },
  })

  revalidatePath(`/analyses/${share.analysisId}`)
  return { success: true }
}

// ─── Comments ───────────────────────────────────────────────────────

export async function addAnalysisComment(analysisId: string, content: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  await db.insert(analysisComments).values({
    analysisId,
    authorId: ctx.userId,
    content,
  })

  revalidatePath(`/analyses/${analysisId}`)
  return { success: true }
}

export async function updateAnalysisComment(commentId: string, content: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [comment] = await db
    .select()
    .from(analysisComments)
    .where(eq(analysisComments.id, commentId))
    .limit(1)
  if (!comment) return { success: false, error: 'not_found' }
  if (comment.authorId !== ctx.userId) return { success: false, error: 'unauthorized' }

  await db
    .update(analysisComments)
    .set({ content, updatedAt: new Date() })
    .where(eq(analysisComments.id, commentId))

  revalidatePath(`/analyses/${comment.analysisId}`)
  return { success: true }
}

export async function deleteAnalysisComment(commentId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [comment] = await db
    .select()
    .from(analysisComments)
    .where(eq(analysisComments.id, commentId))
    .limit(1)
  if (!comment) return { success: false, error: 'not_found' }
  if (comment.authorId !== ctx.userId) return { success: false, error: 'unauthorized' }

  await db.delete(analysisComments).where(eq(analysisComments.id, commentId))

  revalidatePath(`/analyses/${comment.analysisId}`)
  return { success: true }
}

// ─── Recordings ─────────────────────────────────────────────────────

export async function startRecording(analysisId: string, language: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [analysis] = await db
    .select()
    .from(analyses)
    .where(
      and(eq(analyses.id, analysisId), eq(analyses.organizationId, ctx.organizationId))
    )
    .limit(1)
  if (!analysis) return { success: false, error: 'not_found' }

  const storagePath = `${ctx.organizationId}/recordings/${analysisId}/${Date.now()}`

  const [recording] = await db
    .insert(analysisRecordings)
    .values({
      analysisId,
      language,
      storagePath,
      status: 'recording',
      recordedBy: ctx.userId,
    })
    .returning()

  return { success: true, recordingId: recording.id, storagePath }
}

export async function finishRecording(
  recordingId: string,
  durationSeconds: number,
  liveTranscript: string
) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [recording] = await db
    .select()
    .from(analysisRecordings)
    .where(eq(analysisRecordings.id, recordingId))
    .limit(1)

  if (!recording || recording.recordedBy !== ctx.userId) {
    return { success: false, error: 'not_found' }
  }

  await db
    .update(analysisRecordings)
    .set({
      status: 'completed',
      durationSeconds,
      liveTranscript: liveTranscript || null,
      finalTranscript: liveTranscript || null,
      updatedAt: new Date(),
    })
    .where(eq(analysisRecordings.id, recordingId))

  revalidatePath(`/analyses/${recording.analysisId}`)
  return { success: true }
}

export async function saveRecordingTranscript(
  recordingId: string,
  finalTranscript: string
) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  await db
    .update(analysisRecordings)
    .set({
      status: 'completed',
      finalTranscript,
      updatedAt: new Date(),
    })
    .where(eq(analysisRecordings.id, recordingId))

  return { success: true }
}

export async function getAnalysisRecordings(analysisId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      recording: analysisRecordings,
      recorderName: users.fullName,
      recorderEmail: users.email,
    })
    .from(analysisRecordings)
    .innerJoin(users, eq(analysisRecordings.recordedBy, users.id))
    .where(eq(analysisRecordings.analysisId, analysisId))
    .orderBy(desc(analysisRecordings.createdAt))

  return rows.map((r) => ({
    id: r.recording.id,
    status: r.recording.status,
    language: r.recording.language,
    durationSeconds: r.recording.durationSeconds,
    liveTranscript: r.recording.liveTranscript,
    finalTranscript: r.recording.finalTranscript,
    chunksUploaded: r.recording.chunksUploaded,
    recorderName: r.recorderName ?? r.recorderEmail,
    createdAt: r.recording.createdAt,
  }))
}

export type RecordingRow = Awaited<ReturnType<typeof getAnalysisRecordings>>[number]

// ─── Deepgram ───────────────────────────────────────────────────────

/** Upload an audio chunk to storage. */
export async function uploadRecordingChunk(
  recordingId: string,
  chunkIndex: string,
  chunkBase64: string
) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false }

  const [recording] = await db
    .select()
    .from(analysisRecordings)
    .where(eq(analysisRecordings.id, recordingId))
    .limit(1)

  if (!recording || recording.recordedBy !== ctx.userId) {
    return { success: false }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminSupabase = createAdminClient()

  const bytes = Buffer.from(chunkBase64, 'base64')
  const chunkPath =
    chunkIndex === 'final'
      ? `${recording.storagePath}/recording.webm`
      : `${recording.storagePath}/chunk-${String(chunkIndex).padStart(4, '0')}.webm`

  const { error } = await adminSupabase.storage
    .from('org-assets')
    .upload(chunkPath, bytes, { contentType: 'audio/webm', upsert: true })

  if (error) return { success: false }

  if (chunkIndex !== 'final') {
    await db
      .update(analysisRecordings)
      .set({ chunksUploaded: parseInt(chunkIndex, 10) + 1, updatedAt: new Date() })
      .where(eq(analysisRecordings.id, recordingId))
  }

  return { success: true }
}

/** Get a playable URL for a recording's final audio file. */
export async function getRecordingAudioUrl(recordingId: string): Promise<string | null> {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return null

  const [recording] = await db
    .select()
    .from(analysisRecordings)
    .where(eq(analysisRecordings.id, recordingId))
    .limit(1)

  if (!recording || !recording.storagePath) return null

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminSupabase = createAdminClient()
  const { data } = adminSupabase.storage
    .from('org-assets')
    .getPublicUrl(`${recording.storagePath}/recording.webm`)

  return data.publicUrl
}

/** Check if Deepgram is configured (platform-wide secret). */
export async function checkDeepgramAvailable(): Promise<boolean> {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return false

  const apiKey = await getIntegrationSecret('deepgram', 'api_key')
  return !!apiKey
}

/** Get the Deepgram API key for client-side WebSocket connection. */
export async function getDeepgramKey(): Promise<string | null> {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return null

  return getIntegrationSecret('deepgram', 'api_key')
}
