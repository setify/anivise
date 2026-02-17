'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  forms,
  formVersions,
  formOrganizationAssignments,
  formSubmissions,
} from '@/lib/db/schema'
import { eq, and, isNull, count, desc, sql } from 'drizzle-orm'
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
