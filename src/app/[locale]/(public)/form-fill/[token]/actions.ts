'use server'

import { db } from '@/lib/db'
import {
  analysisFormAssignments,
  forms,
  formVersions,
  formSubmissions,
  employees,
  organizations,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getOrgBranding } from '@/lib/branding/apply-branding'

export interface TokenFormData {
  form: {
    id: string
    title: string
    description: string | null
    stepDisplayMode: string
    completionType: string
    completionTitle: string | null
    completionMessage: string | null
    completionRedirectUrl: string | null
  }
  schema: Record<string, unknown>
  branding: {
    primaryColor: string | null
    logoUrl: string | null
    organizationName: string
  }
  assignment: {
    id: string
    status: string
    employeeName: string
  }
}

export type TokenError = 'invalid' | 'expired' | 'already_completed'

export async function getFormByToken(
  token: string
): Promise<{ data: TokenFormData } | { error: TokenError }> {
  // Find assignment by token
  const [row] = await db
    .select({
      assignment: analysisFormAssignments,
      formTitle: forms.title,
      formDescription: forms.description,
      formStepDisplayMode: forms.stepDisplayMode,
      formCompletionType: forms.completionType,
      formCompletionTitle: forms.completionTitle,
      formCompletionMessage: forms.completionMessage,
      formCompletionRedirectUrl: forms.completionRedirectUrl,
      versionSchema: formVersions.schema,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      orgName: organizations.name,
    })
    .from(analysisFormAssignments)
    .innerJoin(forms, eq(analysisFormAssignments.formId, forms.id))
    .innerJoin(formVersions, eq(analysisFormAssignments.formVersionId, formVersions.id))
    .innerJoin(employees, eq(analysisFormAssignments.employeeId, employees.id))
    .innerJoin(organizations, eq(analysisFormAssignments.organizationId, organizations.id))
    .where(eq(analysisFormAssignments.token, token))
    .limit(1)

  if (!row) return { error: 'invalid' }

  // Check if already completed
  if (row.assignment.status === 'completed') {
    return { error: 'already_completed' }
  }

  // Check if expired
  if (new Date() > new Date(row.assignment.tokenExpiresAt)) {
    return { error: 'expired' }
  }

  // Update status to opened if currently pending or sent
  if (row.assignment.status === 'pending' || row.assignment.status === 'sent') {
    const now = new Date()
    await db
      .update(analysisFormAssignments)
      .set({ status: 'opened', openedAt: now, updatedAt: now })
      .where(eq(analysisFormAssignments.id, row.assignment.id))
  }

  // Load branding
  const branding = await getOrgBranding(row.assignment.organizationId)

  return {
    data: {
      form: {
        id: row.assignment.formId,
        title: row.formTitle,
        description: row.formDescription,
        stepDisplayMode: row.formStepDisplayMode,
        completionType: row.formCompletionType,
        completionTitle: row.formCompletionTitle,
        completionMessage: row.formCompletionMessage,
        completionRedirectUrl: row.formCompletionRedirectUrl,
      },
      schema: row.versionSchema as Record<string, unknown>,
      branding: {
        primaryColor: branding.primaryColor,
        logoUrl: branding.logoUrl,
        organizationName: row.orgName,
      },
      assignment: {
        id: row.assignment.id,
        status: row.assignment.status,
        employeeName: `${row.employeeFirstName} ${row.employeeLastName}`,
      },
    },
  }
}

export async function submitFormViaToken(
  token: string,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
) {
  // Validate token again
  const [assignment] = await db
    .select()
    .from(analysisFormAssignments)
    .where(eq(analysisFormAssignments.token, token))
    .limit(1)

  if (!assignment) return { success: false, error: 'invalid_token' }
  if (assignment.status === 'completed') return { success: false, error: 'already_completed' }
  if (new Date() > new Date(assignment.tokenExpiresAt)) {
    return { success: false, error: 'expired' }
  }

  // Create form submission
  const [submission] = await db
    .insert(formSubmissions)
    .values({
      formId: assignment.formId,
      formVersionId: assignment.formVersionId,
      organizationId: assignment.organizationId,
      submittedBy: null, // No logged-in user
      data: data as Record<string, unknown>,
      metadata: metadata as Record<string, unknown> ?? null,
    })
    .returning()

  // Update assignment
  const now = new Date()
  await db
    .update(analysisFormAssignments)
    .set({
      status: 'completed',
      completedAt: now,
      submissionId: submission.id,
      updatedAt: now,
    })
    .where(eq(analysisFormAssignments.id, assignment.id))

  // Get form completion info
  const [form] = await db
    .select({
      completionType: forms.completionType,
      completionTitle: forms.completionTitle,
      completionMessage: forms.completionMessage,
      completionRedirectUrl: forms.completionRedirectUrl,
    })
    .from(forms)
    .where(eq(forms.id, assignment.formId))
    .limit(1)

  return {
    success: true,
    completionType: form?.completionType ?? 'thank_you',
    completionTitle: form?.completionTitle,
    completionMessage: form?.completionMessage,
    completionRedirectUrl: form?.completionRedirectUrl,
  }
}
