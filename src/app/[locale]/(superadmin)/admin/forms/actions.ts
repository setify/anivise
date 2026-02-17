'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  forms,
  formVersions,
  formOrganizationAssignments,
  formSubmissions,
} from '@/lib/db/schema'
import { eq, and, isNull, count, desc, sql, ne } from 'drizzle-orm'
import { organizations, users } from '@/lib/db/schema'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { formMetaValidator } from '@/lib/validations/forms'
import { logAudit } from '@/lib/audit/log'
import type { FormSchema } from '@/types/form-schema'

// ─── List Forms ───

export async function getForms() {
  await requirePlatformRole('staff')

  const allForms = await db
    .select()
    .from(forms)
    .where(isNull(forms.deletedAt))
    .orderBy(desc(forms.createdAt))

  // Get submission counts
  const submissionCounts = await db
    .select({
      formId: formSubmissions.formId,
      count: count(),
    })
    .from(formSubmissions)
    .groupBy(formSubmissions.formId)

  // Get assignment counts
  const assignmentCounts = await db
    .select({
      formId: formOrganizationAssignments.formId,
      count: count(),
    })
    .from(formOrganizationAssignments)
    .groupBy(formOrganizationAssignments.formId)

  const submissionMap = new Map(submissionCounts.map((s) => [s.formId, s.count]))
  const assignmentMap = new Map(assignmentCounts.map((a) => [a.formId, a.count]))

  return allForms.map((form) => ({
    ...form,
    submissionCount: submissionMap.get(form.id) ?? 0,
    assignmentCount: assignmentMap.get(form.id) ?? 0,
  }))
}

// ─── Get Form By ID ───

export async function getFormById(formId: string) {
  await requirePlatformRole('staff')

  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
    .limit(1)

  return form ?? null
}

// ─── Get Current Form Version ───

export async function getCurrentFormVersion(formId: string) {
  await requirePlatformRole('staff')

  const [form] = await db
    .select({ currentVersion: forms.currentVersion })
    .from(forms)
    .where(eq(forms.id, formId))
    .limit(1)

  if (!form) return null

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

  return version ?? null
}

// ─── Create Form ───

export async function createForm(data: {
  title: string
  description?: string
  slug: string
  stepDisplayMode?: 'progress_bar' | 'tabs'
  visibility?: 'all_organizations' | 'assigned'
}) {
  const currentUser = await requirePlatformRole('superadmin')

  const parsed = formMetaValidator.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Invalid input' }
  }

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: forms.id })
    .from(forms)
    .where(eq(forms.slug, parsed.data.slug))
    .limit(1)

  if (existing) {
    return { success: false as const, error: 'Slug already in use' }
  }

  const defaultSchema: FormSchema = {
    version: '1.0',
    steps: [
      {
        id: crypto.randomUUID(),
        title: 'Step 1',
        fields: [],
      },
    ],
  }

  const [newForm] = await db
    .insert(forms)
    .values({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      slug: parsed.data.slug,
      status: 'draft',
      createdBy: currentUser.id,
      visibility: parsed.data.visibility ?? 'assigned',
      stepDisplayMode: parsed.data.stepDisplayMode ?? 'progress_bar',
    })
    .returning()

  // Create initial version
  await db.insert(formVersions).values({
    formId: newForm.id,
    versionNumber: 1,
    schema: defaultSchema as unknown as Record<string, unknown>,
  })

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'settings.updated',
    entityType: 'form',
    entityId: newForm.id,
    metadata: { action: 'form.created', title: newForm.title, slug: newForm.slug },
  })

  revalidatePath('/admin/forms')
  return { success: true as const, formId: newForm.id }
}

// ─── Save Form Schema (Auto-save / Draft) ───

export async function saveFormSchema(
  formId: string,
  schema: FormSchema
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [form] = await db
      .select()
      .from(forms)
      .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
      .limit(1)

    if (!form) return { success: false, error: 'Form not found' }

    // Update the current version's schema in-place (auto-save)
    await db
      .update(formVersions)
      .set({
        schema: schema as unknown as Record<string, unknown>,
      })
      .where(
        and(
          eq(formVersions.formId, formId),
          eq(formVersions.versionNumber, form.currentVersion)
        )
      )

    await db
      .update(forms)
      .set({ updatedAt: new Date() })
      .where(eq(forms.id, formId))

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save form' }
  }
}

// ─── Save Form Schema as New Version ───

export async function saveFormVersion(
  formId: string,
  schema: FormSchema
): Promise<{ success: boolean; error?: string; versionNumber?: number }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [form] = await db
      .select()
      .from(forms)
      .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
      .limit(1)

    if (!form) return { success: false, error: 'Form not found' }

    const nextVersion = form.currentVersion + 1

    await db.insert(formVersions).values({
      formId,
      versionNumber: nextVersion,
      schema: schema as unknown as Record<string, unknown>,
    })

    await db
      .update(forms)
      .set({ currentVersion: nextVersion, updatedAt: new Date() })
      .where(eq(forms.id, formId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: formId,
      metadata: { action: 'form.version_created', version: nextVersion },
    })

    revalidatePath('/admin/forms')
    return { success: true, versionNumber: nextVersion }
  } catch {
    return { success: false, error: 'Failed to save version' }
  }
}

// ─── Update Form Meta ───

export async function updateFormMeta(
  formId: string,
  data: {
    title?: string
    description?: string
    slug?: string
    visibility?: 'all_organizations' | 'assigned'
    stepDisplayMode?: 'progress_bar' | 'tabs'
    completionType?: 'thank_you' | 'redirect'
    completionTitle?: string
    completionMessage?: string
    completionRedirectUrl?: string
    sendConfirmationEmail?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    // Check slug uniqueness if slug is being changed
    if (data.slug) {
      const [existing] = await db
        .select({ id: forms.id })
        .from(forms)
        .where(
          and(
            eq(forms.slug, data.slug),
            sql`${forms.id} != ${formId}`
          )
        )
        .limit(1)

      if (existing) {
        return { success: false, error: 'Slug already in use' }
      }
    }

    await db
      .update(forms)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
        ...(data.stepDisplayMode !== undefined && { stepDisplayMode: data.stepDisplayMode }),
        ...(data.completionType !== undefined && { completionType: data.completionType }),
        ...(data.completionTitle !== undefined && { completionTitle: data.completionTitle || null }),
        ...(data.completionMessage !== undefined && { completionMessage: data.completionMessage || null }),
        ...(data.completionRedirectUrl !== undefined && { completionRedirectUrl: data.completionRedirectUrl || null }),
        ...(data.sendConfirmationEmail !== undefined && { sendConfirmationEmail: data.sendConfirmationEmail }),
        updatedAt: new Date(),
      })
      .where(eq(forms.id, formId))

    revalidatePath('/admin/forms')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update form' }
  }
}

// ─── Publish Form ───

export async function publishForm(
  formId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [form] = await db
      .select()
      .from(forms)
      .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
      .limit(1)

    if (!form) return { success: false, error: 'Form not found' }

    const now = new Date()

    await db
      .update(formVersions)
      .set({ publishedAt: now, publishedBy: currentUser.id })
      .where(
        and(
          eq(formVersions.formId, formId),
          eq(formVersions.versionNumber, form.currentVersion)
        )
      )

    await db
      .update(forms)
      .set({ status: 'published', updatedAt: now })
      .where(eq(forms.id, formId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: formId,
      metadata: { action: 'form.published', version: form.currentVersion },
    })

    revalidatePath('/admin/forms')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to publish form' }
  }
}

// ─── Archive Form ───

export async function archiveForm(
  formId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    await db
      .update(forms)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(forms.id, formId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: formId,
      metadata: { action: 'form.archived' },
    })

    revalidatePath('/admin/forms')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to archive form' }
  }
}

// ─── Duplicate Form ───

export async function duplicateForm(
  formId: string
): Promise<{ success: boolean; error?: string; newFormId?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [form] = await db
      .select()
      .from(forms)
      .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
      .limit(1)

    if (!form) return { success: false, error: 'Form not found' }

    // Get the current version schema
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

    // Generate unique slug
    let newSlug = `${form.slug}-copy`
    let slugSuffix = 1
    while (true) {
      const [existing] = await db
        .select({ id: forms.id })
        .from(forms)
        .where(eq(forms.slug, newSlug))
        .limit(1)
      if (!existing) break
      slugSuffix++
      newSlug = `${form.slug}-copy-${slugSuffix}`
    }

    const [newForm] = await db
      .insert(forms)
      .values({
        title: `${form.title} (Copy)`,
        description: form.description,
        slug: newSlug,
        status: 'draft',
        createdBy: currentUser.id,
        visibility: form.visibility,
        stepDisplayMode: form.stepDisplayMode,
        completionType: form.completionType,
        completionTitle: form.completionTitle,
        completionMessage: form.completionMessage,
        completionRedirectUrl: form.completionRedirectUrl,
        sendConfirmationEmail: form.sendConfirmationEmail,
      })
      .returning()

    await db.insert(formVersions).values({
      formId: newForm.id,
      versionNumber: 1,
      schema: version?.schema ?? { version: '1.0', steps: [{ id: crypto.randomUUID(), title: 'Step 1', fields: [] }] },
    })

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: newForm.id,
      metadata: { action: 'form.duplicated', sourceFormId: formId },
    })

    revalidatePath('/admin/forms')
    return { success: true, newFormId: newForm.id }
  } catch {
    return { success: false, error: 'Failed to duplicate form' }
  }
}

// ─── Delete Form (soft) ───

export async function deleteForm(
  formId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [form] = await db
      .select({ status: forms.status })
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1)

    if (!form) return { success: false, error: 'Form not found' }
    if (form.status !== 'draft') return { success: false, error: 'Only draft forms can be deleted' }

    await db
      .update(forms)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(forms.id, formId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: formId,
      metadata: { action: 'form.deleted' },
    })

    revalidatePath('/admin/forms')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete form' }
  }
}

// ─── Check Slug Availability ───

export async function checkFormSlugAvailability(
  slug: string,
  excludeFormId?: string
): Promise<{ available: boolean }> {
  await requirePlatformRole('staff')

  const conditions = [eq(forms.slug, slug)]
  if (excludeFormId) {
    conditions.push(sql`${forms.id} != ${excludeFormId}`)
  }

  const [existing] = await db
    .select({ id: forms.id })
    .from(forms)
    .where(and(...conditions))
    .limit(1)

  return { available: !existing }
}

// ─── Get Form Assignments ───

export async function getFormAssignments(formId: string) {
  await requirePlatformRole('staff')

  const assignments = await db
    .select({
      id: formOrganizationAssignments.id,
      orgId: formOrganizationAssignments.organizationId,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      assignedAt: formOrganizationAssignments.assignedAt,
      assignedByName: users.fullName,
      assignedByEmail: users.email,
    })
    .from(formOrganizationAssignments)
    .innerJoin(organizations, eq(formOrganizationAssignments.organizationId, organizations.id))
    .leftJoin(users, eq(formOrganizationAssignments.assignedBy, users.id))
    .where(eq(formOrganizationAssignments.formId, formId))
    .orderBy(desc(formOrganizationAssignments.assignedAt))

  return assignments
}

// ─── Search Organizations (for assignment autocomplete) ───

export async function searchOrganizations(query: string, excludeFormId?: string) {
  await requirePlatformRole('superadmin')

  const allOrgs = await db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(isNull(organizations.deletedAt))
    .orderBy(organizations.name)

  // Filter by query
  const filtered = query
    ? allOrgs.filter(
        (org) =>
          org.name.toLowerCase().includes(query.toLowerCase()) ||
          org.slug.toLowerCase().includes(query.toLowerCase())
      )
    : allOrgs

  // Exclude already-assigned orgs
  if (excludeFormId) {
    const assigned = await db
      .select({ orgId: formOrganizationAssignments.organizationId })
      .from(formOrganizationAssignments)
      .where(eq(formOrganizationAssignments.formId, excludeFormId))

    const assignedIds = new Set(assigned.map((a) => a.orgId))
    return filtered.filter((org) => !assignedIds.has(org.id))
  }

  return filtered
}

// ─── Assign Form to Organization ───

export async function assignFormToOrganization(
  formId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    await db.insert(formOrganizationAssignments).values({
      formId,
      organizationId: orgId,
      assignedBy: currentUser.id,
    })

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: formId,
      metadata: { action: 'form.assigned', organizationId: orgId },
    })

    revalidatePath('/admin/forms')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to assign organization' }
  }
}

// ─── Remove Form Organization Assignment ───

export async function removeFormOrganizationAssignment(
  formId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    await db
      .delete(formOrganizationAssignments)
      .where(
        and(
          eq(formOrganizationAssignments.formId, formId),
          eq(formOrganizationAssignments.organizationId, orgId)
        )
      )

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: formId,
      metadata: { action: 'form.unassigned', organizationId: orgId },
    })

    revalidatePath('/admin/forms')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to remove assignment' }
  }
}

// ─── Set Form Visibility ───

export async function setFormVisibility(
  formId: string,
  visibility: 'all_organizations' | 'assigned'
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [form] = await db
      .select({ visibility: forms.visibility })
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1)

    if (!form) return { success: false, error: 'Form not found' }

    await db
      .update(forms)
      .set({ visibility, updatedAt: new Date() })
      .where(eq(forms.id, formId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: formId,
      metadata: {
        action: 'form.visibility_changed',
        from: form.visibility,
        to: visibility,
      },
    })

    revalidatePath('/admin/forms')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update visibility' }
  }
}

// ─── Set Form Status (status transitions) ───

export async function setFormStatus(
  formId: string,
  status: 'draft' | 'published' | 'archived'
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [form] = await db
      .select({ status: forms.status })
      .from(forms)
      .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
      .limit(1)

    if (!form) return { success: false, error: 'Form not found' }

    // Validate transitions
    const validTransitions: Record<string, string[]> = {
      draft: ['published', 'archived'],
      published: ['draft', 'archived'],
      archived: ['draft'],
    }

    if (!validTransitions[form.status]?.includes(status)) {
      return { success: false, error: `Cannot transition from ${form.status} to ${status}` }
    }

    await db
      .update(forms)
      .set({ status, updatedAt: new Date() })
      .where(eq(forms.id, formId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: formId,
      metadata: { action: `form.status_changed`, from: form.status, to: status },
    })

    revalidatePath('/admin/forms')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update form status' }
  }
}

// ─── Publish Form with Validation ───

export async function publishFormWithValidation(
  formId: string
): Promise<{
  success: boolean
  error?: string
  validationErrors?: string[]
  submissionCount?: number
}> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [form] = await db
      .select()
      .from(forms)
      .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
      .limit(1)

    if (!form) return { success: false, error: 'Form not found' }

    // Load current version schema
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

    if (!version) return { success: false, error: 'No version found' }

    const schema = version.schema as unknown as FormSchema

    // Validate schema
    const errors: string[] = []

    if (!schema.steps || schema.steps.length === 0) {
      errors.push('Form must have at least 1 step')
    }

    const allFieldIds = new Set<string>()
    for (const step of schema.steps) {
      if (!step.fields || step.fields.length === 0) {
        errors.push(`Step "${step.title}" has no fields`)
      }
      for (const field of step.fields) {
        allFieldIds.add(field.id)
        if (field.required && !field.label) {
          errors.push(`Required field in step "${step.title}" has no label`)
        }
        if (
          (field.type === 'radio' || field.type === 'checkbox') &&
          field.config.type === field.type
        ) {
          if (!field.config.options || field.config.options.length === 0) {
            errors.push(
              `Field "${field.label || '(no label)'}" in step "${step.title}" has no options`
            )
          }
        }
        // Check conditional logic references
        if (field.conditionalLogic?.conditions) {
          for (const cond of field.conditionalLogic.conditions) {
            if (!allFieldIds.has(cond.fieldId)) {
              errors.push(
                `Field "${field.label || '(no label)'}" references non-existent field in its conditions`
              )
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      return { success: false, validationErrors: errors }
    }

    // Check if already published with submissions
    const [subCount] = await db
      .select({ count: count() })
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, formId))

    const submissionCount = subCount?.count ?? 0
    const wasPublished = form.status === 'published'

    // If already published, create new version
    if (wasPublished) {
      const nextVersion = form.currentVersion + 1
      await db.insert(formVersions).values({
        formId,
        versionNumber: nextVersion,
        schema: schema as unknown as Record<string, unknown>,
        publishedAt: new Date(),
        publishedBy: currentUser.id,
      })
      await db
        .update(forms)
        .set({ currentVersion: nextVersion, updatedAt: new Date() })
        .where(eq(forms.id, formId))
    } else {
      // First publish: mark current version as published
      const now = new Date()
      await db
        .update(formVersions)
        .set({ publishedAt: now, publishedBy: currentUser.id })
        .where(
          and(
            eq(formVersions.formId, formId),
            eq(formVersions.versionNumber, form.currentVersion)
          )
        )
      await db
        .update(forms)
        .set({ status: 'published', updatedAt: now })
        .where(eq(forms.id, formId))
    }

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'form',
      entityId: formId,
      metadata: {
        action: 'form.published',
        version: wasPublished ? form.currentVersion + 1 : form.currentVersion,
        existingSubmissions: submissionCount,
      },
    })

    revalidatePath('/admin/forms')
    return { success: true, submissionCount: wasPublished ? submissionCount : 0 }
  } catch {
    return { success: false, error: 'Failed to publish form' }
  }
}

// ─── Get Email Templates (for completion config) ───

export async function getEmailTemplates() {
  await requirePlatformRole('staff')

  const { emailTemplates: emailTemplatesTable } = await import('@/lib/db/schema')
  const templates = await db
    .select({ id: emailTemplatesTable.id, slug: emailTemplatesTable.slug })
    .from(emailTemplatesTable)
    .orderBy(emailTemplatesTable.slug)

  return templates
}
