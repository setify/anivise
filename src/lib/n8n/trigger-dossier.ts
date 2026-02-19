import { db } from '@/lib/db'
import {
  analyses,
  employees,
  analysisRecordings,
  analysisDocuments,
  analysisFormAssignments,
  formSubmissions,
  forms,
  orgDepartments,
  orgLocations,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCachedSecret } from '@/lib/crypto/secrets-cache'
import { resolveWebhookUrl } from './resolve-webhook-url'

export interface DossierTriggerPayload {
  dossierId: string
  analysisId: string
  organizationId: string
  callbackUrl: string
  subject: {
    name: string
    email?: string
    position?: string
    department?: string
    location?: string
  }
  transcripts: { id: string; filename?: string; language: string; text: string }[]
  documents: { id: string; name: string; text: string }[]
  formResponses: { formTitle: string; data: Record<string, unknown> }[]
  prompt: string
}

/**
 * Gather all analysis data and trigger the n8n dossier webhook.
 */
export async function triggerDossierWebhook(
  dossierId: string,
  analysisId: string,
  organizationId: string,
  prompt: string
): Promise<{ success: boolean; isTest: boolean; error?: string }> {
  const resolved = await resolveWebhookUrl('dossier')

  if (!resolved) {
    return { success: false, isTest: false, error: 'n8n dossier webhook URL not configured' }
  }

  const { url: webhookUrl, isTest } = resolved

  const authHeaderName =
    (await getCachedSecret('n8n', 'auth_header_name')) || 'X-Anivise-Secret'
  const authHeaderValue =
    (await getCachedSecret('n8n', 'auth_header_value')) ||
    process.env.N8N_WEBHOOK_SECRET

  if (!authHeaderValue) {
    return { success: false, isTest, error: 'n8n auth secret not configured' }
  }

  // 1. Load analysis + employee data
  const [analysis] = await db
    .select({
      name: analyses.name,
      employeeId: analyses.employeeId,
    })
    .from(analyses)
    .where(
      and(eq(analyses.id, analysisId), eq(analyses.organizationId, organizationId))
    )
    .limit(1)

  if (!analysis) {
    return { success: false, isTest, error: 'Analysis not found' }
  }

  const [emp] = await db
    .select({
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      position: employees.position,
      departmentId: employees.departmentId,
      locationId: employees.locationId,
    })
    .from(employees)
    .where(eq(employees.id, analysis.employeeId))
    .limit(1)

  // Resolve department/location names
  let departmentName: string | undefined
  let locationName: string | undefined

  if (emp?.departmentId) {
    const [dept] = await db
      .select({ name: orgDepartments.name })
      .from(orgDepartments)
      .where(eq(orgDepartments.id, emp.departmentId))
      .limit(1)
    departmentName = dept?.name
  }

  if (emp?.locationId) {
    const [loc] = await db
      .select({ name: orgLocations.name })
      .from(orgLocations)
      .where(eq(orgLocations.id, emp.locationId))
      .limit(1)
    locationName = loc?.name
  }

  // 2. Load transcripts
  const recordings = await db
    .select({
      id: analysisRecordings.id,
      filename: analysisRecordings.filename,
      language: analysisRecordings.language,
      finalTranscript: analysisRecordings.finalTranscript,
      liveTranscript: analysisRecordings.liveTranscript,
    })
    .from(analysisRecordings)
    .where(eq(analysisRecordings.analysisId, analysisId))

  const transcripts = recordings
    .map((r) => ({
      id: r.id,
      filename: r.filename ?? undefined,
      language: r.language,
      text: r.finalTranscript || r.liveTranscript || '',
    }))
    .filter((t) => t.text.length > 0)

  // 3. Load documents
  const docs = await db
    .select({
      id: analysisDocuments.id,
      name: analysisDocuments.name,
      extractedText: analysisDocuments.extractedText,
    })
    .from(analysisDocuments)
    .where(eq(analysisDocuments.analysisId, analysisId))

  const documents = docs
    .map((d) => ({
      id: d.id,
      name: d.name,
      text: d.extractedText || '',
    }))
    .filter((d) => d.text.length > 0)

  // 4. Load form responses
  const assignments = await db
    .select({
      formTitle: forms.title,
      submissionData: formSubmissions.data,
    })
    .from(analysisFormAssignments)
    .innerJoin(forms, eq(analysisFormAssignments.formId, forms.id))
    .innerJoin(
      formSubmissions,
      eq(analysisFormAssignments.submissionId, formSubmissions.id)
    )
    .where(
      and(
        eq(analysisFormAssignments.analysisId, analysisId),
        eq(analysisFormAssignments.status, 'completed')
      )
    )

  const formResponses = assignments.map((a) => ({
    formTitle: a.formTitle,
    data: (a.submissionData ?? {}) as Record<string, unknown>,
  }))

  // 5. Build callback URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const callbackUrl = `${appUrl}/api/webhooks/n8n/dossier-complete`

  // 6. Build payload
  const payload: DossierTriggerPayload = {
    dossierId,
    analysisId,
    organizationId,
    callbackUrl,
    subject: {
      name: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      email: emp?.email ?? undefined,
      position: emp?.position ?? undefined,
      department: departmentName,
      location: locationName,
    },
    transcripts,
    documents,
    formResponses,
    prompt,
  }

  // 7. Send to n8n
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [authHeaderName]: authHeaderValue,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      return {
        success: false,
        isTest,
        error: `n8n responded with status ${response.status}`,
      }
    }

    return { success: true, isTest }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return { success: false, isTest, error: `Failed to reach n8n: ${message}` }
  }
}
