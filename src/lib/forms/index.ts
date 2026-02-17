import { db } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import {
  forms,
  formVersions,
  formOrganizationAssignments,
} from '@/lib/db/schema'
import type { FormSchema } from '@/types/form-schema'

/**
 * Get a form by ID, excluding soft-deleted forms.
 */
export async function getForm(formId: string) {
  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), eq(forms.deletedAt, null!)))
    .limit(1)

  return form ?? null
}

/**
 * Get a form by slug, excluding soft-deleted forms.
 */
export async function getFormBySlug(slug: string) {
  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.slug, slug), eq(forms.deletedAt, null!)))
    .limit(1)

  return form ?? null
}

/**
 * Get a specific form version by form ID and version number.
 * If no version number is provided, returns the latest published version.
 */
export async function getFormVersion(formId: string, versionNumber?: number) {
  if (versionNumber !== undefined) {
    const [version] = await db
      .select()
      .from(formVersions)
      .where(
        and(
          eq(formVersions.formId, formId),
          eq(formVersions.versionNumber, versionNumber)
        )
      )
      .limit(1)

    return version ?? null
  }

  // Get the latest published version
  const [version] = await db
    .select()
    .from(formVersions)
    .where(eq(formVersions.formId, formId))
    .orderBy(desc(formVersions.versionNumber))
    .limit(1)

  return version ?? null
}

/**
 * Check if an organization can access a form.
 * A form is accessible if:
 * - visibility is 'all_organizations', OR
 * - the form's organizationId matches, OR
 * - the organization has an explicit assignment
 */
export async function canOrganizationAccessForm(
  formId: string,
  organizationId: string
): Promise<boolean> {
  const form = await getForm(formId)
  if (!form) return false

  // Platform-wide forms visible to all
  if (form.visibility === 'all_organizations') return true

  // Form owned by this organization
  if (form.organizationId === organizationId) return true

  // Check explicit assignment
  const [assignment] = await db
    .select()
    .from(formOrganizationAssignments)
    .where(
      and(
        eq(formOrganizationAssignments.formId, formId),
        eq(formOrganizationAssignments.organizationId, organizationId)
      )
    )
    .limit(1)

  return !!assignment
}

/**
 * Create a new form version with the given schema.
 * Increments the version number from the form's currentVersion.
 */
export async function createFormVersion(
  formId: string,
  schema: FormSchema,
  userId?: string
) {
  const form = await getForm(formId)
  if (!form) throw new Error('Form not found')

  const nextVersion = form.currentVersion + 1

  const [version] = await db
    .insert(formVersions)
    .values({
      formId,
      versionNumber: nextVersion,
      schema: schema as unknown as Record<string, unknown>,
      publishedBy: userId ?? null,
    })
    .returning()

  // Update the form's currentVersion
  await db
    .update(forms)
    .set({
      currentVersion: nextVersion,
      updatedAt: new Date(),
    })
    .where(eq(forms.id, formId))

  return version
}

/**
 * Publish a form: sets status to 'published' and marks the current version
 * with a publishedAt timestamp.
 */
export async function publishForm(formId: string, userId: string) {
  const form = await getForm(formId)
  if (!form) throw new Error('Form not found')

  // Get the current version
  const [currentVersion] = await db
    .select()
    .from(formVersions)
    .where(
      and(
        eq(formVersions.formId, formId),
        eq(formVersions.versionNumber, form.currentVersion)
      )
    )
    .limit(1)

  if (!currentVersion) throw new Error('No version found to publish')

  const now = new Date()

  // Mark the version as published
  await db
    .update(formVersions)
    .set({
      publishedAt: now,
      publishedBy: userId,
    })
    .where(eq(formVersions.id, currentVersion.id))

  // Update form status
  await db
    .update(forms)
    .set({
      status: 'published',
      updatedAt: now,
    })
    .where(eq(forms.id, formId))

  return { form, version: currentVersion }
}
