'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { guideCategories, guides, mediaFiles } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { logAudit } from '@/lib/audit/log'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackUpload } from '@/lib/media/track-upload'

// ─── Allowed MIME types ─────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

// ─── Query Helpers ──────────────────────────────────────────────────

export async function getGuideCategories() {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      category: guideCategories,
      guideCount: count(guides.id),
    })
    .from(guideCategories)
    .leftJoin(
      guides,
      and(
        eq(guides.categoryId, guideCategories.id),
        eq(guides.organizationId, ctx.organizationId)
      )
    )
    .where(eq(guideCategories.organizationId, ctx.organizationId))
    .groupBy(guideCategories.id)
    .orderBy(guideCategories.sortOrder, guideCategories.name)

  return rows.map((r) => ({
    id: r.category.id,
    name: r.category.name,
    description: r.category.description,
    sortOrder: r.category.sortOrder,
    guideCount: r.guideCount,
  }))
}

export type GuideCategoryRow = Awaited<ReturnType<typeof getGuideCategories>>[number]

export async function getGuides() {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      guide: guides,
      categoryName: guideCategories.name,
    })
    .from(guides)
    .leftJoin(guideCategories, eq(guides.categoryId, guideCategories.id))
    .where(eq(guides.organizationId, ctx.organizationId))
    .orderBy(guides.sortOrder, guides.name)

  // Filter by role-based access
  const filtered = rows.filter((r) => {
    if (ctx.role === 'org_admin') return true
    if (ctx.role === 'manager') return r.guide.accessManagers
    return r.guide.accessEmployees // member
  })

  return filtered.map((r) => ({
    id: r.guide.id,
    name: r.guide.name,
    description: r.guide.description,
    icon: r.guide.icon,
    filename: r.guide.filename,
    mimeType: r.guide.mimeType,
    fileSize: r.guide.fileSize,
    categoryId: r.guide.categoryId,
    categoryName: r.categoryName,
    accessManagers: r.guide.accessManagers,
    accessEmployees: r.guide.accessEmployees,
    storagePath: r.guide.storagePath,
    sortOrder: r.guide.sortOrder,
  }))
}

export type GuideRow = Awaited<ReturnType<typeof getGuides>>[number]

export async function getGuideDownloadUrl(guideId: string) {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return null

  const [guide] = await db
    .select()
    .from(guides)
    .where(
      and(eq(guides.id, guideId), eq(guides.organizationId, ctx.organizationId))
    )
    .limit(1)

  if (!guide) return null

  // Role-based access check
  if (ctx.role === 'member' && !guide.accessEmployees) return null
  if (ctx.role === 'manager' && !guide.accessManagers) return null

  const adminSupabase = createAdminClient()
  const { data } = adminSupabase.storage
    .from('org-assets')
    .getPublicUrl(guide.storagePath)

  return data.publicUrl
}

// ─── Category CRUD (org_admin only) ─────────────────────────────────

export async function createGuideCategory(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null

  const [cat] = await db
    .insert(guideCategories)
    .values({
      organizationId: ctx.organizationId,
      name,
      description,
    })
    .returning()

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'guide_category.created',
    entityType: 'guide_category',
    entityId: cat.id,
    organizationId: ctx.organizationId,
    metadata: { name },
  })

  revalidatePath('/guides')
  revalidatePath('/guides/categories')
  return { success: true, category: cat }
}

export async function updateGuideCategory(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null

  await db
    .update(guideCategories)
    .set({ name, description, updatedAt: new Date() })
    .where(
      and(
        eq(guideCategories.id, id),
        eq(guideCategories.organizationId, ctx.organizationId)
      )
    )

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'guide_category.updated',
    entityType: 'guide_category',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/guides')
  revalidatePath('/guides/categories')
  return { success: true }
}

export async function deleteGuideCategory(id: string) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  // Set categoryId to null on orphaned guides
  await db
    .update(guides)
    .set({ categoryId: null, updatedAt: new Date() })
    .where(
      and(eq(guides.categoryId, id), eq(guides.organizationId, ctx.organizationId))
    )

  await db
    .delete(guideCategories)
    .where(
      and(
        eq(guideCategories.id, id),
        eq(guideCategories.organizationId, ctx.organizationId)
      )
    )

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'guide_category.deleted',
    entityType: 'guide_category',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/guides')
  revalidatePath('/guides/categories')
  return { success: true }
}

// ─── Guide CRUD (org_admin only) ────────────────────────────────────

export async function createGuide(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  const icon = (formData.get('icon') as string) || 'File'
  const categoryId = (formData.get('categoryId') as string) || null
  const accessManagers = formData.get('accessManagers') === 'true'
  const accessEmployees = formData.get('accessEmployees') === 'true'
  const file = formData.get('file') as File

  if (!file || file.size === 0) {
    return { success: false, error: 'no_file' }
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { success: false, error: 'invalid_file_type' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'file_too_large' }
  }

  // Upload to storage
  const adminSupabase = createAdminClient()
  const storagePath = `${ctx.organizationId}/guides/${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await adminSupabase.storage
    .from('org-assets')
    .upload(storagePath, bytes, { contentType: file.type, upsert: false })

  if (uploadError) {
    return { success: false, error: 'upload_failed' }
  }

  // Track in media_files
  const mediaFileId = await trackUpload({
    bucket: 'org-assets',
    path: storagePath,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    context: 'guide',
    uploadedBy: ctx.userId,
  })

  // Insert guide record
  const [guide] = await db
    .insert(guides)
    .values({
      organizationId: ctx.organizationId,
      categoryId: categoryId || null,
      name,
      description,
      icon,
      storagePath,
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      mediaFileId,
      accessManagers,
      accessEmployees,
      createdBy: ctx.userId,
    })
    .returning()

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'guide.created',
    entityType: 'guide',
    entityId: guide.id,
    organizationId: ctx.organizationId,
    metadata: { name, filename: file.name },
  })

  revalidatePath('/guides')
  return { success: true }
}

export async function updateGuide(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  const icon = (formData.get('icon') as string) || 'File'
  const categoryId = (formData.get('categoryId') as string) || null
  const accessManagers = formData.get('accessManagers') === 'true'
  const accessEmployees = formData.get('accessEmployees') === 'true'
  const file = formData.get('file') as File | null

  // Verify ownership
  const [existing] = await db
    .select()
    .from(guides)
    .where(
      and(eq(guides.id, id), eq(guides.organizationId, ctx.organizationId))
    )
    .limit(1)

  if (!existing) return { success: false, error: 'not_found' }

  const updates: Record<string, unknown> = {
    name,
    description,
    icon,
    categoryId: categoryId || null,
    accessManagers,
    accessEmployees,
    updatedAt: new Date(),
  }

  // Replace file if a new one is provided
  if (file && file.size > 0) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { success: false, error: 'invalid_file_type' }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'file_too_large' }
    }

    const adminSupabase = createAdminClient()

    // Delete old file from storage
    await adminSupabase.storage.from('org-assets').remove([existing.storagePath])

    // Delete old media_files record
    if (existing.mediaFileId) {
      await db.delete(mediaFiles).where(eq(mediaFiles.id, existing.mediaFileId))
    }

    // Upload new file
    const storagePath = `${ctx.organizationId}/guides/${Date.now()}-${file.name}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await adminSupabase.storage
      .from('org-assets')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      return { success: false, error: 'upload_failed' }
    }

    const mediaFileId = await trackUpload({
      bucket: 'org-assets',
      path: storagePath,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      context: 'guide',
      uploadedBy: ctx.userId,
    })

    updates.storagePath = storagePath
    updates.filename = file.name
    updates.mimeType = file.type
    updates.fileSize = file.size
    updates.mediaFileId = mediaFileId
  }

  await db
    .update(guides)
    .set(updates)
    .where(eq(guides.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'guide.updated',
    entityType: 'guide',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/guides')
  return { success: true }
}

export async function deleteGuide(id: string) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [guide] = await db
    .select()
    .from(guides)
    .where(
      and(eq(guides.id, id), eq(guides.organizationId, ctx.organizationId))
    )
    .limit(1)

  if (!guide) return { success: false, error: 'not_found' }

  // Delete from storage
  const adminSupabase = createAdminClient()
  await adminSupabase.storage.from('org-assets').remove([guide.storagePath])

  // Delete media_files record
  if (guide.mediaFileId) {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, guide.mediaFileId))
  }

  // Delete guide record
  await db
    .delete(guides)
    .where(eq(guides.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'guide.deleted',
    entityType: 'guide',
    entityId: id,
    organizationId: ctx.organizationId,
    metadata: { name: guide.name, filename: guide.filename },
  })

  revalidatePath('/guides')
  return { success: true }
}
