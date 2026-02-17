'use server'

import { db } from '@/lib/db'
import {
  forms,
  formVersions,
  formOrganizationAssignments,
  formSubmissions,
  organizationMembers,
} from '@/lib/db/schema'
import { eq, and, isNull, desc, sql, gte, count } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logAudit } from '@/lib/audit/log'
import type { FormSchema } from '@/types/form-schema'
import { getOrganizationLimits, checkLimit } from '@/lib/products/limits'

async function getCurrentUserAndOrg() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // For now, get the user's first org membership
  const [membership] = await db
    .select({
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .limit(1)

  return {
    userId: user.id,
    email: user.email ?? '',
    organizationId: membership?.organizationId ?? null,
  }
}

// ─── Get Forms Available to Organization ───

export async function getAvailableForms() {
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return []

  // Get all published forms that are either:
  // 1. visible to all organizations
  // 2. assigned to this organization
  // 3. owned by this organization
  const allForms = await db
    .select()
    .from(forms)
    .where(
      and(
        isNull(forms.deletedAt),
        eq(forms.status, 'published')
      )
    )
    .orderBy(desc(forms.createdAt))

  const assignments = await db
    .select({ formId: formOrganizationAssignments.formId })
    .from(formOrganizationAssignments)
    .where(eq(formOrganizationAssignments.organizationId, organizationId))

  const assignedFormIds = new Set(assignments.map((a) => a.formId))

  const accessibleForms = allForms.filter(
    (form) =>
      form.visibility === 'all_organizations' ||
      form.organizationId === organizationId ||
      assignedFormIds.has(form.id)
  )

  // Get submissions for this org
  const submissions = await db
    .select({
      formId: formSubmissions.formId,
      submittedAt: formSubmissions.submittedAt,
    })
    .from(formSubmissions)
    .where(eq(formSubmissions.organizationId, organizationId))
    .orderBy(desc(formSubmissions.submittedAt))

  const submissionMap = new Map<string, Date>()
  for (const sub of submissions) {
    if (!submissionMap.has(sub.formId)) {
      submissionMap.set(sub.formId, sub.submittedAt)
    }
  }

  return accessibleForms.map((form) => ({
    ...form,
    lastSubmittedAt: submissionMap.get(form.id) ?? null,
  }))
}

// ─── Get Form By Slug for Rendering ───

export async function getFormBySlugForRendering(slug: string) {
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId) return null

  const [form] = await db
    .select()
    .from(forms)
    .where(
      and(
        eq(forms.slug, slug),
        isNull(forms.deletedAt),
        eq(forms.status, 'published')
      )
    )
    .limit(1)

  if (!form) return null

  // Check access
  if (form.visibility !== 'all_organizations' && form.organizationId !== organizationId) {
    const [assignment] = await db
      .select()
      .from(formOrganizationAssignments)
      .where(
        and(
          eq(formOrganizationAssignments.formId, form.id),
          eq(formOrganizationAssignments.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!assignment) return null
  }

  // Get the published version (latest with publishedAt)
  const [version] = await db
    .select()
    .from(formVersions)
    .where(
      and(
        eq(formVersions.formId, form.id),
        eq(formVersions.versionNumber, form.currentVersion)
      )
    )
    .limit(1)

  if (!version) return null

  // Check if already submitted
  const [existing] = await db
    .select({ id: formSubmissions.id, submittedAt: formSubmissions.submittedAt })
    .from(formSubmissions)
    .where(
      and(
        eq(formSubmissions.formId, form.id),
        eq(formSubmissions.organizationId, organizationId),
        eq(formSubmissions.submittedBy, userId)
      )
    )
    .orderBy(desc(formSubmissions.submittedAt))
    .limit(1)

  return {
    form,
    version,
    schema: version.schema as unknown as FormSchema,
    existingSubmission: existing ?? null,
  }
}

// ─── Submit Form ───

export async function submitForm(params: {
  formId: string
  formVersionId: string
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, email, organizationId } = await getCurrentUserAndOrg()
    if (!organizationId) {
      return { success: false, error: 'No organization context' }
    }

    // Verify form exists and is published
    const [form] = await db
      .select()
      .from(forms)
      .where(
        and(
          eq(forms.id, params.formId),
          isNull(forms.deletedAt),
          eq(forms.status, 'published')
        )
      )
      .limit(1)

    if (!form) {
      return { success: false, error: 'Form not found or not published' }
    }

    // Check org access
    if (form.visibility !== 'all_organizations' && form.organizationId !== organizationId) {
      const [assignment] = await db
        .select()
        .from(formOrganizationAssignments)
        .where(
          and(
            eq(formOrganizationAssignments.formId, params.formId),
            eq(formOrganizationAssignments.organizationId, organizationId)
          )
        )
        .limit(1)

      if (!assignment) {
        return { success: false, error: 'Access denied' }
      }
    }

    // Check form submission limit
    const limits = await getOrganizationLimits(organizationId)
    if (limits.maxFormSubmissionsPerMonth !== null) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const [currentCount] = await db
        .select({ value: count() })
        .from(formSubmissions)
        .where(
          and(
            eq(formSubmissions.organizationId, organizationId),
            gte(formSubmissions.submittedAt, startOfMonth)
          )
        )

      if (!checkLimit(limits.maxFormSubmissionsPerMonth, currentCount?.value ?? 0)) {
        return { success: false, error: 'form_submission_limit_reached' }
      }
    }

    // Load version schema for server-side validation
    const [version] = await db
      .select()
      .from(formVersions)
      .where(eq(formVersions.id, params.formVersionId))
      .limit(1)

    if (!version) {
      return { success: false, error: 'Form version not found' }
    }

    // Save submission
    await db.insert(formSubmissions).values({
      formId: params.formId,
      formVersionId: params.formVersionId,
      organizationId,
      submittedBy: userId,
      data: params.data as Record<string, unknown>,
      metadata: {
        ...(params.metadata ?? {}),
        userAgent: 'server',
        submittedAt: new Date().toISOString(),
      } as Record<string, unknown>,
    })

    // Audit log
    await logAudit({
      actorId: userId,
      actorEmail: email,
      action: 'settings.updated',
      entityType: 'form_submission',
      entityId: params.formId,
      organizationId,
      metadata: { action: 'form.submitted', formTitle: form.title },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to submit form' }
  }
}
