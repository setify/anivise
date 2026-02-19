import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analysisDossiers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod/v4'
import { createNotification } from '@/lib/notifications/create'
import { getCachedSecret } from '@/lib/crypto/secrets-cache'

const callbackSchema = z.object({
  dossierId: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum(['completed', 'failed']),
  resultData: z.record(z.string(), z.unknown()).optional(),
  modelUsed: z.string().optional(),
  tokenUsage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
    })
    .optional(),
  errorMessage: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // Validate the shared secret
  const authHeaderName =
    (await getCachedSecret('n8n', 'auth_header_name')) || 'X-Anivise-Secret'
  const expectedSecret =
    (await getCachedSecret('n8n', 'auth_header_value')) ||
    process.env.N8N_WEBHOOK_SECRET

  const receivedSecret = request.headers.get(authHeaderName)
  if (!receivedSecret || !expectedSecret || receivedSecret !== expectedSecret) {
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

  const { dossierId, organizationId, status, resultData, modelUsed, tokenUsage, errorMessage } =
    parsed.data

  // Verify dossier exists and belongs to claimed org
  const [dossier] = await db
    .select()
    .from(analysisDossiers)
    .where(
      and(
        eq(analysisDossiers.id, dossierId),
        eq(analysisDossiers.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!dossier) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Dossier not found' } },
      { status: 404 }
    )
  }

  // Update dossier
  await db
    .update(analysisDossiers)
    .set({
      status,
      resultData: resultData ?? null,
      modelUsed: modelUsed ?? null,
      tokenUsage: tokenUsage ?? null,
      completedAt: new Date(),
      errorMessage: errorMessage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(analysisDossiers.id, dossierId))

  // Notifications — in test mode, only notify the requester (superadmin who triggered)
  if (status === 'completed') {
    await createNotification({
      recipientId: dossier.requestedBy,
      type: 'analysis.completed',
      title: dossier.isTest ? '[TEST] Dossier erstellt' : 'Dossier erstellt',
      body: `Das Dossier für Analyse ${dossier.analysisId.slice(0, 8)}... wurde erfolgreich erstellt.`,
      link: `/analyses/${dossier.analysisId}`,
    })
  }

  if (status === 'failed') {
    await createNotification({
      recipientId: dossier.requestedBy,
      type: 'analysis.failed',
      title: dossier.isTest ? '[TEST] Dossier fehlgeschlagen' : 'Dossier fehlgeschlagen',
      body: errorMessage ?? `Dossier ${dossierId.slice(0, 8)}... ist fehlgeschlagen.`,
      link: `/analyses/${dossier.analysisId}`,
    })

    // Only notify all superadmins for non-test dossiers
    if (!dossier.isTest) {
      await createNotification({
        recipientId: 'all_superadmins',
        type: 'analysis.failed',
        title: 'Dossier-Generierung fehlgeschlagen',
        body: `Dossier ${dossierId.slice(0, 8)}... in Org ${organizationId.slice(0, 8)}... fehlgeschlagen: ${errorMessage ?? 'Unbekannter Fehler'}`,
      })
    }
  }

  return NextResponse.json({ success: true })
}
