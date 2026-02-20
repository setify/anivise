'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  mediaFiles,
  organizations,
  organizationMembers,
  organizationProducts,
  products,
} from '@/lib/db/schema'
import { eq, desc, inArray, like, and, sql, count, SQL } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit/log'
import { trackUpload } from '@/lib/media/track-upload'
import { checkMediaUsage, checkBulkMediaUsage } from '@/lib/media/check-usage'
import { syncMediaStorage } from '@/lib/media/sync-storage'
import {
  MEDIA_BUCKET,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  buildStoragePath,
} from '@/lib/media/storage-paths'
import type { MediaContext, MediaFile } from '@/types/database'

// ─── Ensure bucket exists ───

async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, {
    public: true,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    fileSizeLimit: MAX_FILE_SIZE,
  })
  if (error && !error.message.includes('already exists')) {
    throw error
  }
}

// ─── List Media ───

export async function listMedia(params?: {
  context?: MediaContext
  search?: string
}): Promise<{ success: boolean; data?: MediaFile[]; error?: string }> {
  try {
    await requirePlatformRole()

    const conditions: SQL[] = []
    if (params?.context) {
      conditions.push(eq(mediaFiles.context, params.context))
    }
    if (params?.search) {
      conditions.push(like(mediaFiles.filename, `%${params.search}%`))
    }

    const files = await db
      .select()
      .from(mediaFiles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(mediaFiles.createdAt))

    return { success: true, data: files }
  } catch {
    return { success: false, error: 'Failed to load media files' }
  }
}

// ─── Upload Media ───

export async function uploadMedia(
  formData: FormData
): Promise<{ success: boolean; data?: MediaFile; error?: string }> {
  try {
    const currentUser = await requirePlatformRole()
    const file = formData.get('file') as File | null
    const context = (formData.get('context') as MediaContext) || 'general'
    const contextEntityId = formData.get('contextEntityId') as string | null

    if (!file || file.size === 0) {
      return { success: false, error: 'No file provided' }
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type: ${file.type}. Allowed: PNG, JPG, SVG, WebP, GIF, PDF.`,
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File too large. Maximum 5 MB.' }
    }

    const storagePath = buildStoragePath(context, file.name, contextEntityId ?? undefined)
    const supabase = createAdminClient()
    await ensureBucket(supabase)

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    const mediaId = await trackUpload({
      bucket: MEDIA_BUCKET,
      path: storagePath,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      context,
      contextEntityId: contextEntityId ?? undefined,
      uploadedBy: currentUser.id,
    })

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'media.uploaded',
      entityType: 'media_file',
      entityId: mediaId,
      metadata: {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        context,
      },
    })

    // Fetch the created record
    const [created] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, mediaId))

    revalidatePath('/admin/media')
    return { success: true, data: created }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to upload file',
    }
  }
}

// ─── Delete Media ───

export async function deleteMedia(
  fileId: string,
  force?: boolean
): Promise<{ success: boolean; error?: string; inUse?: boolean; usedIn?: string[] }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [file] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, fileId))

    if (!file) {
      return { success: false, error: 'File not found' }
    }

    // Check usage unless forced
    if (!force) {
      const usage = await checkMediaUsage(file)
      if (usage.inUse) {
        return {
          success: false,
          error: 'File is in use',
          inUse: true,
          usedIn: usage.usedIn,
        }
      }
    }

    // Delete from storage
    const supabase = createAdminClient()
    const { error: storageErr } = await supabase.storage
      .from(file.bucket)
      .remove([file.path])

    if (storageErr) {
      return { success: false, error: `Storage delete failed: ${storageErr.message}` }
    }

    // Delete from DB
    await db.delete(mediaFiles).where(eq(mediaFiles.id, fileId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'media.deleted',
      entityType: 'media_file',
      entityId: fileId,
      metadata: {
        filename: file.filename,
        path: file.path,
        context: file.context,
      },
    })

    revalidatePath('/admin/media')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete file',
    }
  }
}

// ─── Bulk Delete ───

export async function bulkDeleteMedia(
  fileIds: string[],
  force?: boolean
): Promise<{ success: boolean; deleted: number; skipped: number; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    if (fileIds.length === 0) {
      return { success: true, deleted: 0, skipped: 0 }
    }

    const files = await db
      .select()
      .from(mediaFiles)
      .where(inArray(mediaFiles.id, fileIds))

    let deleted = 0
    let skipped = 0

    // Check usage for all files at once
    const usageMap = force
      ? new Map<string, { inUse: false; usedIn: [] }>()
      : await checkBulkMediaUsage(files)

    const supabase = createAdminClient()

    for (const file of files) {
      const usage = usageMap.get(file.id)
      if (!force && usage?.inUse) {
        skipped++
        continue
      }

      await supabase.storage.from(file.bucket).remove([file.path])
      await db.delete(mediaFiles).where(eq(mediaFiles.id, file.id))
      deleted++
    }

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'media.bulk_deleted',
      entityType: 'media_file',
      metadata: {
        fileIds: fileIds,
        deleted,
        skipped,
        forced: force ?? false,
      },
    })

    revalidatePath('/admin/media')
    return { success: true, deleted, skipped }
  } catch (err) {
    return {
      success: false,
      deleted: 0,
      skipped: 0,
      error: err instanceof Error ? err.message : 'Bulk delete failed',
    }
  }
}

// ─── Sync Storage ───

export async function syncMedia(): Promise<{
  success: boolean
  added?: number
  removed?: number
  errors?: string[]
  error?: string
}> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const result = await syncMediaStorage(currentUser.id)

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'media.synced',
      entityType: 'media_file',
      metadata: {
        added: result.added,
        removed: result.removed,
        errors: result.errors,
      },
    })

    revalidatePath('/admin/media')
    return {
      success: true,
      added: result.added,
      removed: result.removed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Sync failed',
    }
  }
}

// ─── Storage Stats ───

export async function getStorageStats(): Promise<{
  success: boolean
  data?: {
    totalSize: number
    fileCount: number
    byContext: { context: string; size: number; count: number }[]
    byOrganization: {
      orgId: string
      orgName: string
      size: number
      count: number
      quotaMb: number | null
    }[]
  }
  error?: string
}> {
  try {
    await requirePlatformRole('superadmin')

    // Total stats
    const [totalResult] = await db
      .select({
        totalSize: sql<number>`COALESCE(SUM(${mediaFiles.size}), 0)`,
        fileCount: count(),
      })
      .from(mediaFiles)

    // By context
    const byContext = await db
      .select({
        context: mediaFiles.context,
        size: sql<number>`COALESCE(SUM(${mediaFiles.size}), 0)`,
        count: count(),
      })
      .from(mediaFiles)
      .groupBy(mediaFiles.context)
      .orderBy(sql`SUM(${mediaFiles.size}) DESC`)

    // By organization - join via uploadedBy -> organizationMembers -> organizations
    const byOrg = await db
      .select({
        orgId: organizations.id,
        orgName: organizations.name,
        size: sql<number>`COALESCE(SUM(${mediaFiles.size}), 0)`,
        count: count(),
      })
      .from(mediaFiles)
      .innerJoin(
        organizationMembers,
        eq(mediaFiles.uploadedBy, organizationMembers.userId)
      )
      .innerJoin(
        organizations,
        eq(organizationMembers.organizationId, organizations.id)
      )
      .groupBy(organizations.id, organizations.name)
      .orderBy(sql`SUM(${mediaFiles.size}) DESC`)

    // Get quotas from organization products
    const orgQuotas = await db
      .select({
        orgId: organizationProducts.organizationId,
        quotaMb: sql<number | null>`COALESCE(${organizationProducts.overrideMaxStorageMb}, ${products.maxStorageMb})`,
      })
      .from(organizationProducts)
      .innerJoin(products, eq(organizationProducts.productId, products.id))

    const quotaMap = new Map(orgQuotas.map((q) => [q.orgId, q.quotaMb]))

    return {
      success: true,
      data: {
        totalSize: Number(totalResult?.totalSize ?? 0),
        fileCount: totalResult?.fileCount ?? 0,
        byContext: byContext.map((c) => ({
          context: c.context,
          size: Number(c.size),
          count: c.count,
        })),
        byOrganization: byOrg.map((o) => ({
          orgId: o.orgId,
          orgName: o.orgName,
          size: Number(o.size),
          count: o.count,
          quotaMb: quotaMap.get(o.orgId) ?? null,
        })),
      },
    }
  } catch (error) {
    console.error('Failed to get storage stats:', error)
    return { success: false, error: 'Failed to get storage stats' }
  }
}

// ─── Get Public URL ───

export async function getMediaPublicUrl(
  fileId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    await requirePlatformRole()

    const [file] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, fileId))

    if (!file) {
      return { success: false, error: 'File not found' }
    }

    const supabase = createAdminClient()
    const { data } = supabase.storage.from(file.bucket).getPublicUrl(file.path)

    return { success: true, url: data.publicUrl }
  } catch {
    return { success: false, error: 'Failed to get URL' }
  }
}
