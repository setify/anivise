'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'
import { setSetting, type PlatformSettings } from '@/lib/settings/platform'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackUpload } from '@/lib/media/track-upload'
import { db } from '@/lib/db'
import { mediaFiles } from '@/lib/db/schema'
import { and, eq, like } from 'drizzle-orm'

export async function updatePlatformSettings(
  section: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const allowedKeys: (keyof PlatformSettings)[] = [
      'platform.name',
      'platform.default_locale',
      'platform.default_product_id',
      'invitation.expiry_days',
      'invitation.max_resends',
      'org.reserved_slugs',
      'analysis.max_transcript_size_mb',
    ]

    const changedKeys: string[] = []

    for (const [key, value] of Object.entries(data)) {
      if (!allowedKeys.includes(key as keyof PlatformSettings)) continue
      await setSetting(
        key as keyof PlatformSettings,
        value as PlatformSettings[keyof PlatformSettings],
        currentUser.id
      )
      changedKeys.push(key)
    }

    if (changedKeys.length > 0) {
      await logAudit({
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        action: 'settings.updated',
        entityType: 'platform_settings',
        metadata: { section, changedKeys },
      })
    }

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to save settings:', error)
    return { success: false, error: 'Failed to save settings' }
  }
}

// ─── Platform Logo ───

const LOGO_BUCKET = 'platform-assets'
const LOGO_PATH = 'platform-logo'
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const MAX_SIZE = 512_000 // 500 KB

async function ensureLogoBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { error } = await supabase.storage.createBucket(LOGO_BUCKET, {
    public: true,
    allowedMimeTypes: ALLOWED_TYPES,
    fileSizeLimit: MAX_SIZE,
  })
  if (error && !error.message.includes('already exists')) {
    throw error
  }
}

export async function uploadPlatformLogo(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')
    const file = formData.get('logo') as File | null

    if (!file || file.size === 0) {
      return { success: false, error: 'No file provided' }
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Use PNG, JPG, SVG or WebP.' }
    }

    if (file.size > MAX_SIZE) {
      return { success: false, error: 'File too large. Maximum 500 KB.' }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filePath = `${LOGO_PATH}.${ext}`

    const supabase = createAdminClient()
    await ensureLogoBucket(supabase)

    // Remove any existing platform logo files
    const { data: existingFiles } = await supabase.storage
      .from(LOGO_BUCKET)
      .list('', { search: LOGO_PATH })

    if (existingFiles && existingFiles.length > 0) {
      await supabase.storage
        .from(LOGO_BUCKET)
        .remove(existingFiles.map((f) => f.name))
    }

    // Upload new file
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    const { data: urlData } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    await setSetting('platform.logo_url', publicUrl, currentUser.id)

    // Track in media_files (replace old platform-logo entry)
    await db
      .delete(mediaFiles)
      .where(
        and(
          eq(mediaFiles.bucket, LOGO_BUCKET),
          like(mediaFiles.path, `${LOGO_PATH}%`)
        )
      )

    await trackUpload({
      bucket: LOGO_BUCKET,
      path: filePath,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      context: 'general',
      uploadedBy: currentUser.id,
    })

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'platform_settings',
      metadata: {
        section: 'general',
        action: 'platform_logo.uploaded',
        fileName: file.name,
        fileSize: file.size,
      },
    })

    revalidatePath('/admin/settings')
    revalidatePath('/admin')
    return { success: true, url: publicUrl }
  } catch (err) {
    console.error('Failed to upload platform logo:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to upload logo',
    }
  }
}

export async function deletePlatformLogo(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const currentUser = await requirePlatformRole('superadmin')
    const supabase = createAdminClient()

    // Remove all platform-logo files from storage
    const { data: existingFiles } = await supabase.storage
      .from(LOGO_BUCKET)
      .list('', { search: LOGO_PATH })

    if (existingFiles && existingFiles.length > 0) {
      await supabase.storage
        .from(LOGO_BUCKET)
        .remove(existingFiles.map((f) => f.name))
    }

    await setSetting('platform.logo_url', '', currentUser.id)

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'platform_settings',
      metadata: {
        section: 'general',
        action: 'platform_logo.deleted',
      },
    })

    revalidatePath('/admin/settings')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    console.error('Failed to delete platform logo:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete logo',
    }
  }
}

// ─── Set Platform Logo from URL (Media Picker) ───

export async function setPlatformLogoUrl(
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    await setSetting('platform.logo_url', url, currentUser.id)

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'platform_settings',
      metadata: {
        section: 'general',
        action: 'platform_logo.set_from_media',
        url,
      },
    })

    revalidatePath('/admin/settings')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to set logo URL',
    }
  }
}
