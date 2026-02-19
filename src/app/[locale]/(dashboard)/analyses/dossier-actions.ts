'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { analysisDossiers, analyses } from '@/lib/db/schema'
import { eq, and, desc, isNull, or } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { triggerDossierWebhook } from '@/lib/n8n/trigger-dossier'
import { createNotification } from '@/lib/notifications/create'

const DOSSIER_PROMPT = `Du bist ein Experte für psychodynamische Musteranalyse in Führungsentscheidungen.
Analysiere die folgenden Daten und erstelle eine kurze Zusammenfassung.

Antworte IMMER in diesem JSON-Format:
{
  "summary": "2-3 Sätze Zusammenfassung der wichtigsten Muster und Beobachtungen.",
  "confidence": 0.0-1.0
}`

export async function generateDossier(analysisId: string) {
  const ctx = await getCurrentOrgContext('manager')
  if (!ctx) return { success: false, error: 'unauthorized' }

  // Verify analysis belongs to org
  const [analysis] = await db
    .select()
    .from(analyses)
    .where(
      and(
        eq(analyses.id, analysisId),
        eq(analyses.organizationId, ctx.organizationId),
        isNull(analyses.deletedAt)
      )
    )
    .limit(1)

  if (!analysis) return { success: false, error: 'not_found' }

  // Check no dossier is already pending/processing
  const [existing] = await db
    .select({ id: analysisDossiers.id, status: analysisDossiers.status })
    .from(analysisDossiers)
    .where(
      and(
        eq(analysisDossiers.analysisId, analysisId),
        eq(analysisDossiers.organizationId, ctx.organizationId),
        or(
          eq(analysisDossiers.status, 'pending'),
          eq(analysisDossiers.status, 'processing')
        )
      )
    )
    .limit(1)

  if (existing) {
    return { success: false, error: 'already_in_progress' }
  }

  // Resolve isTest before inserting so the flag is set correctly
  const { resolveWebhookUrl } = await import('@/lib/n8n/resolve-webhook-url')
  const resolved = await resolveWebhookUrl('dossier')
  const isTest = resolved?.isTest ?? false

  // Insert dossier record with isTest flag
  const [dossier] = await db
    .insert(analysisDossiers)
    .values({
      analysisId,
      organizationId: ctx.organizationId,
      status: 'pending',
      promptText: DOSSIER_PROMPT,
      requestedBy: ctx.userId,
      isTest,
    })
    .returning()

  // Trigger n8n webhook
  const result = await triggerDossierWebhook(
    dossier.id,
    analysisId,
    ctx.organizationId,
    DOSSIER_PROMPT
  )

  if (result.success) {
    // Update status to processing
    await db
      .update(analysisDossiers)
      .set({ status: 'processing', startedAt: new Date(), updatedAt: new Date() })
      .where(eq(analysisDossiers.id, dossier.id))

    await createNotification({
      recipientId: ctx.userId,
      type: 'system.info',
      title: 'Dossier wird generiert',
      body: 'Die KI-Analyse wurde gestartet. Sie werden benachrichtigt, sobald das Ergebnis vorliegt.',
      link: `/analyses/${analysisId}`,
    })
  } else {
    // Mark as failed
    await db
      .update(analysisDossiers)
      .set({
        status: 'failed',
        errorMessage: result.error ?? 'Failed to trigger n8n webhook',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(analysisDossiers.id, dossier.id))
  }

  revalidatePath(`/analyses/${analysisId}`)
  return { success: result.success, dossierId: dossier.id, error: result.error }
}

export async function getAnalysisDossiers(analysisId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select()
    .from(analysisDossiers)
    .where(
      and(
        eq(analysisDossiers.analysisId, analysisId),
        eq(analysisDossiers.organizationId, ctx.organizationId)
      )
    )
    .orderBy(desc(analysisDossiers.createdAt))

  return rows.map((r) => ({
    id: r.id,
    analysisId: r.analysisId,
    status: r.status,
    promptText: r.promptText,
    resultData: r.resultData as Record<string, unknown> | null,
    errorMessage: r.errorMessage,
    modelUsed: r.modelUsed,
    tokenUsage: r.tokenUsage as { prompt_tokens: number; completion_tokens: number } | null,
    requestedBy: r.requestedBy,
    isTest: r.isTest,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    createdAt: r.createdAt,
  }))
}

export type DossierRow = Awaited<ReturnType<typeof getAnalysisDossiers>>[number]

export async function getLatestDossierStatus(analysisId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return null

  const [row] = await db
    .select({
      id: analysisDossiers.id,
      status: analysisDossiers.status,
    })
    .from(analysisDossiers)
    .where(
      and(
        eq(analysisDossiers.analysisId, analysisId),
        eq(analysisDossiers.organizationId, ctx.organizationId)
      )
    )
    .orderBy(desc(analysisDossiers.createdAt))
    .limit(1)

  if (!row) return null
  return { dossierId: row.id, status: row.status }
}

export async function retryDossier(dossierId: string) {
  const ctx = await getCurrentOrgContext('manager')
  if (!ctx) return { success: false, error: 'unauthorized' }

  // Load failed dossier
  const [dossier] = await db
    .select()
    .from(analysisDossiers)
    .where(
      and(
        eq(analysisDossiers.id, dossierId),
        eq(analysisDossiers.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!dossier) return { success: false, error: 'not_found' }
  if (dossier.status !== 'failed') return { success: false, error: 'not_failed' }

  // Create a new dossier with same prompt
  return generateDossier(dossier.analysisId)
}
