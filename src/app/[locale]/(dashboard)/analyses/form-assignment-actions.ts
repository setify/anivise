'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  analysisFormAssignments,
  analyses,
  forms,
  formVersions,
  formOrganizationAssignments,
  formSubmissions,
  employees,
  users,
  organizations,
} from '@/lib/db/schema'
import { eq, and, desc, notInArray, isNull, or } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { sendTemplatedEmail } from '@/lib/email/send'
import { logAudit } from '@/lib/audit/log'

// ─── Query Helpers ──────────────────────────────────────────────────

export async function getAnalysisFormAssignments(analysisId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      assignment: analysisFormAssignments,
      formTitle: forms.title,
      formDescription: forms.description,
      submissionData: formSubmissions.data,
      submissionSubmittedAt: formSubmissions.submittedAt,
      formVersionSchema: formVersions.schema,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(analysisFormAssignments)
    .innerJoin(forms, eq(analysisFormAssignments.formId, forms.id))
    .innerJoin(formVersions, eq(analysisFormAssignments.formVersionId, formVersions.id))
    .innerJoin(employees, eq(analysisFormAssignments.employeeId, employees.id))
    .leftJoin(
      formSubmissions,
      eq(analysisFormAssignments.submissionId, formSubmissions.id)
    )
    .where(
      and(
        eq(analysisFormAssignments.analysisId, analysisId),
        eq(analysisFormAssignments.organizationId, ctx.organizationId)
      )
    )
    .orderBy(desc(analysisFormAssignments.createdAt))

  return rows.map((r) => ({
    id: r.assignment.id,
    analysisId: r.assignment.analysisId,
    formId: r.assignment.formId,
    formTitle: r.formTitle,
    formDescription: r.formDescription,
    status: r.assignment.status,
    dueDate: r.assignment.dueDate,
    sentAt: r.assignment.sentAt,
    openedAt: r.assignment.openedAt,
    completedAt: r.assignment.completedAt,
    reminderCount: r.assignment.reminderCount,
    lastReminderAt: r.assignment.lastReminderAt,
    createdAt: r.assignment.createdAt,
    submissionData: r.submissionData as Record<string, unknown> | null,
    submissionSubmittedAt: r.submissionSubmittedAt,
    formVersionSchema: r.formVersionSchema as Record<string, unknown> | null,
    employeeName: `${r.employeeFirstName} ${r.employeeLastName}`,
  }))
}

export type FormAssignmentRow = Awaited<
  ReturnType<typeof getAnalysisFormAssignments>
>[number]

export async function getAvailableFormsForAssignment(analysisId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  // Get already assigned form IDs for this analysis
  const assignedRows = await db
    .select({ formId: analysisFormAssignments.formId })
    .from(analysisFormAssignments)
    .where(eq(analysisFormAssignments.analysisId, analysisId))

  const assignedFormIds = assignedRows.map((r) => r.formId)

  // Get published forms accessible to this org
  const allForms = await db
    .select({
      id: forms.id,
      title: forms.title,
      description: forms.description,
    })
    .from(forms)
    .where(
      and(
        eq(forms.status, 'published'),
        isNull(forms.deletedAt)
      )
    )
    .orderBy(forms.title)

  // Filter: org has access + not already assigned
  const accessible: { id: string; title: string; description: string | null }[] = []

  for (const form of allForms) {
    if (assignedFormIds.includes(form.id)) continue

    // Check access: all_organizations OR owned by org OR explicit assignment
    const [fullForm] = await db
      .select({ visibility: forms.visibility, organizationId: forms.organizationId })
      .from(forms)
      .where(eq(forms.id, form.id))
      .limit(1)

    if (!fullForm) continue

    let hasAccess = false
    if (fullForm.visibility === 'all_organizations') {
      hasAccess = true
    } else if (fullForm.organizationId === ctx.organizationId) {
      hasAccess = true
    } else {
      const [assignment] = await db
        .select()
        .from(formOrganizationAssignments)
        .where(
          and(
            eq(formOrganizationAssignments.formId, form.id),
            eq(formOrganizationAssignments.organizationId, ctx.organizationId)
          )
        )
        .limit(1)
      hasAccess = !!assignment
    }

    if (hasAccess) {
      accessible.push(form)
    }
  }

  return accessible
}

export type AvailableForm = Awaited<
  ReturnType<typeof getAvailableFormsForAssignment>
>[number]

// ─── Mutations ──────────────────────────────────────────────────────

export async function assignFormToAnalysis(
  analysisId: string,
  formId: string,
  dueDate?: string
) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  // 1. Verify analysis exists + belongs to org
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
  if (!analysis) return { success: false, error: 'analysis_not_found' }

  // 2. Verify form is published + org has access
  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), eq(forms.status, 'published'), isNull(forms.deletedAt)))
    .limit(1)
  if (!form) return { success: false, error: 'form_not_found' }

  // Access check
  let hasAccess = false
  if (form.visibility === 'all_organizations') {
    hasAccess = true
  } else if (form.organizationId === ctx.organizationId) {
    hasAccess = true
  } else {
    const [assignment] = await db
      .select()
      .from(formOrganizationAssignments)
      .where(
        and(
          eq(formOrganizationAssignments.formId, formId),
          eq(formOrganizationAssignments.organizationId, ctx.organizationId)
        )
      )
      .limit(1)
    hasAccess = !!assignment
  }
  if (!hasAccess) return { success: false, error: 'no_form_access' }

  // 3. Get current published FormVersion
  const [version] = await db
    .select()
    .from(formVersions)
    .where(
      and(
        eq(formVersions.formId, formId),
        eq(formVersions.versionNumber, form.currentVersion)
      )
    )
    .limit(1)
  if (!version) return { success: false, error: 'no_form_version' }

  // 4. Get employee from analysis
  const [emp] = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
    })
    .from(employees)
    .where(eq(employees.id, analysis.employeeId))
    .limit(1)
  if (!emp) return { success: false, error: 'employee_not_found' }

  // 5. Generate token
  const token = crypto.randomBytes(32).toString('hex')
  const tokenExpiresAt = new Date()
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30) // 30 days

  // 6. Insert assignment
  const now = new Date()
  const [assignment] = await db
    .insert(analysisFormAssignments)
    .values({
      analysisId,
      formId,
      formVersionId: version.id,
      organizationId: ctx.organizationId,
      employeeId: emp.id,
      token,
      tokenExpiresAt,
      assignedBy: ctx.userId,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'pending',
    })
    .returning()

  // 7. Send email if employee has email
  if (emp.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const fillLink = `${appUrl}/de/form-fill/${token}`

    // Get org name
    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1)

    // Get assigner name
    const [assigner] = await db
      .select({ fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1)

    await sendTemplatedEmail({
      to: emp.email,
      templateSlug: 'form-assignment',
      locale: 'de',
      variables: {
        employeeName: `${emp.firstName} ${emp.lastName}`,
        formTitle: form.title,
        organizationName: org?.name ?? 'Organisation',
        dueDate: dueDate
          ? new Date(dueDate).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '',
        fillLink,
        assignerName: assigner?.fullName ?? assigner?.email ?? '',
      },
    }).catch(() => {
      // Email failure shouldn't block the assignment
    })

    // Update status to sent
    await db
      .update(analysisFormAssignments)
      .set({ status: 'sent', sentAt: now, updatedAt: now })
      .where(eq(analysisFormAssignments.id, assignment.id))
  }

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'analysis.form_assigned',
    entityType: 'analysis',
    entityId: analysisId,
    organizationId: ctx.organizationId,
    metadata: { formId, assignmentId: assignment.id },
  })

  revalidatePath('/analyses')
  revalidatePath(`/analyses/${analysisId}`)
  return { success: true }
}

export async function sendFormReminder(assignmentId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [assignment] = await db
    .select({
      assignment: analysisFormAssignments,
      formTitle: forms.title,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      employeeEmail: employees.email,
    })
    .from(analysisFormAssignments)
    .innerJoin(forms, eq(analysisFormAssignments.formId, forms.id))
    .innerJoin(employees, eq(analysisFormAssignments.employeeId, employees.id))
    .where(
      and(
        eq(analysisFormAssignments.id, assignmentId),
        eq(analysisFormAssignments.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!assignment) return { success: false, error: 'not_found' }
  if (
    assignment.assignment.status !== 'sent' &&
    assignment.assignment.status !== 'opened'
  ) {
    return { success: false, error: 'invalid_status' }
  }

  if (!assignment.employeeEmail) {
    return { success: false, error: 'no_employee_email' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const fillLink = `${appUrl}/de/form-fill/${assignment.assignment.token}`

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, ctx.organizationId))
    .limit(1)

  const [assigner] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, assignment.assignment.assignedBy))
    .limit(1)

  await sendTemplatedEmail({
    to: assignment.employeeEmail,
    templateSlug: 'form-assignment-reminder',
    locale: 'de',
    variables: {
      employeeName: `${assignment.employeeFirstName} ${assignment.employeeLastName}`,
      formTitle: assignment.formTitle,
      organizationName: org?.name ?? 'Organisation',
      dueDate: assignment.assignment.dueDate
        ? new Date(assignment.assignment.dueDate).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '',
      fillLink,
      assignerName: assigner?.fullName ?? assigner?.email ?? '',
    },
  })

  const now = new Date()
  await db
    .update(analysisFormAssignments)
    .set({
      reminderCount: assignment.assignment.reminderCount + 1,
      lastReminderAt: now,
      updatedAt: now,
    })
    .where(eq(analysisFormAssignments.id, assignmentId))

  revalidatePath(`/analyses/${assignment.assignment.analysisId}`)
  return { success: true }
}

export async function removeFormAssignment(assignmentId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [assignment] = await db
    .select()
    .from(analysisFormAssignments)
    .where(
      and(
        eq(analysisFormAssignments.id, assignmentId),
        eq(analysisFormAssignments.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!assignment) return { success: false, error: 'not_found' }
  if (assignment.status === 'completed') {
    return { success: false, error: 'cannot_remove_completed' }
  }

  await db
    .delete(analysisFormAssignments)
    .where(eq(analysisFormAssignments.id, assignmentId))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'analysis.form_unassigned',
    entityType: 'analysis',
    entityId: assignment.analysisId,
    organizationId: ctx.organizationId,
    metadata: { formId: assignment.formId, assignmentId },
  })

  revalidatePath(`/analyses/${assignment.analysisId}`)
  return { success: true }
}
