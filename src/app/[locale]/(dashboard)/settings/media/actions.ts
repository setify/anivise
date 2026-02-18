'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { mediaFiles, organizationMembers } from '@/lib/db/schema'
import { eq, desc, and, like, SQL } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { logAudit } from '@/lib/audit/log'
import { trackUpload } from '@/lib/media/track-upload'
import { checkMediaUsage } from '@/lib/media/check-usage'
import { MEDIA_BUCKET, buildStoragePath } from '@/lib/media/storage-paths'
import type { MediaContext, MediaFile } from '@/types/database'

const ORG_BUCKET = 'org-assets'
const ORG_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ORG_ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

// ─── Auth helper ────────────────────────────────────────────────────────────

async function requireOrgAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [membership] = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .limit(1)

  if (!membership || membership.role !== 'org_admin') {
    throw new Error('Unauthorized')
  }

  return { userId: user.id, email: user.email ?? '', organizationId: membership.organizationId }
}

// ─── List Org Media ──────────────────────────────────────────────────────────

export async function listOrgMedia(params?: {
  context?: MediaContext
  search?: string
}): Promise<{ success: boolean; data?: MediaFile[]; error?: string }> {
  try {
    const { organizationId } = await requireOrgAdmin()

    const conditions: SQL[] = [eq(mediaFiles.contextEntityId, organizationId)]

    if (params?.context) {
      conditions.push(eq(mediaFiles.context, params.context))
    }
    if (params?.search) {
      conditions.push(like(mediaFiles.filename, `%${params.search}%`))
    }

    const files = await db
      .select()
      .from(mediaFiles)
      .where(and(...conditions))
      .orderBy(desc(mediaFiles.createdAt))

    return { success: true, data: files }
  } catch {
    return { success: false, error: 'Failed to load media files' }
  }
}

// ─── Upload Org Media ────────────────────────────────────────────────────────

export async function uploadOrgMedia(
  formData: FormData
): Promise<{ success: boolean; data?: MediaFile; error?: string; storageLimitReached?: boolean }> {
  try {
    const { userId, organizationId } = await requireOrgAdmin()
    const file = formData.get('file') as File | null
    const context: MediaContext = (formData.get('context') as MediaContext) || 'general'

    if (!file || file.size === 0) return { success: false, error: 'No file provided' }

    if (!ORG_ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: `Dateityp nicht erlaubt: ${file.type}` }
    }

    if (file.size > ORG_MAX_FILE_SIZE) {
      return { success: false, error: 'Datei zu groß. Maximal 10 MB.' }
    }

    // Bucket: org-assets under {orgId}/media/...
    const storagePath = `${organizationId}/media/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const supabase = createAdminClient()

    // Ensure bucket exists
    await supabase.storage.createBucket(ORG_BUCKET, { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from(ORG_BUCKET)
      .upload(storagePath, file, { upsert: false, contentType: file.type })

    if (uploadError) return { success: false, error: uploadError.message }

    const mediaId = await trackUpload({
      bucket: ORG_BUCKET,
      path: storagePath,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      context,
      contextEntityId: organizationId,
      uploadedBy: userId,
    })

    await logAudit({
      actorId: userId,
      actorEmail: '',
      action: 'media.uploaded',
      entityType: 'media_file',
      entityId: mediaId,
      organizationId,
      metadata: { filename: file.name, size: file.size, context },
    })

    const [created] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, mediaId))

    revalidatePath('/settings/media')
    return { success: true, data: created }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

// ─── Delete Org Media ────────────────────────────────────────────────────────

export async function deleteOrgMedia(
  fileId: string,
  force?: boolean
): Promise<{ success: boolean; error?: string; inUse?: boolean; usedIn?: string[] }> {
  try {
    const { userId, organizationId } = await requireOrgAdmin()

    const [file] = await db
      .select()
      .from(mediaFiles)
      .where(and(eq(mediaFiles.id, fileId), eq(mediaFiles.contextEntityId, organizationId)))

    if (!file) return { success: false, error: 'Datei nicht gefunden oder kein Zugriff' }

    if (!force) {
      const usage = await checkMediaUsage(file)
      if (usage.inUse) {
        return { success: false, error: 'File is in use', inUse: true, usedIn: usage.usedIn }
      }
    }

    const supabase = createAdminClient()
    await supabase.storage.from(file.bucket).remove([file.path])
    await db.delete(mediaFiles).where(eq(mediaFiles.id, fileId))

    await logAudit({
      actorId: userId,
      actorEmail: '',
      action: 'media.deleted',
      entityType: 'media_file',
      entityId: fileId,
      organizationId,
      metadata: { filename: file.filename, context: file.context },
    })

    revalidatePath('/settings/media')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Delete failed' }
  }
}

// ─── Get Org Media Public URL ────────────────────────────────────────────────

export async function getOrgMediaPublicUrl(
  fileId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { organizationId } = await requireOrgAdmin()

    const [file] = await db
      .select()
      .from(mediaFiles)
      .where(and(eq(mediaFiles.id, fileId), eq(mediaFiles.contextEntityId, organizationId)))

    if (!file) return { success: false, error: 'File not found' }

    const supabase = createAdminClient()
    const { data } = supabase.storage.from(file.bucket).getPublicUrl(file.path)
    return { success: true, url: data.publicUrl }
  } catch {
    return { success: false, error: 'Failed to get URL' }
  }
}
