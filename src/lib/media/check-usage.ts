import { db } from '@/lib/db'
import { platformSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { MediaFile } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

interface UsageResult {
  inUse: boolean
  usedIn: string[]
}

/**
 * Check whether a media file is currently referenced anywhere.
 * Returns which settings or entities reference the file's public URL.
 */
export async function checkMediaUsage(file: MediaFile): Promise<UsageResult> {
  const supabase = createAdminClient()
  const { data: urlData } = supabase.storage
    .from(file.bucket)
    .getPublicUrl(file.path)

  const publicUrl = urlData.publicUrl
  const usedIn: string[] = []

  // Check platform_settings for any value matching this URL
  const settings = await db
    .select({ key: platformSettings.key, value: platformSettings.value })
    .from(platformSettings)

  for (const s of settings) {
    if (typeof s.value === 'string' && s.value === publicUrl) {
      usedIn.push(`Platform Setting: ${s.key}`)
    }
  }

  // Check email_logo context specifically
  if (file.context === 'email_logo') {
    const logoSetting = settings.find((s) => s.key === 'email.logo_url')
    if (logoSetting && logoSetting.value === publicUrl && !usedIn.length) {
      usedIn.push('E-Mail Logo')
    }
  }

  return {
    inUse: usedIn.length > 0,
    usedIn,
  }
}

/**
 * Check usage for multiple files at once. Returns a map of file ID → usage.
 */
export async function checkBulkMediaUsage(
  files: MediaFile[]
): Promise<Map<string, UsageResult>> {
  // Batch: get all settings once
  const settings = await db
    .select({ key: platformSettings.key, value: platformSettings.value })
    .from(platformSettings)

  const supabase = createAdminClient()
  const results = new Map<string, UsageResult>()

  for (const file of files) {
    const { data: urlData } = supabase.storage
      .from(file.bucket)
      .getPublicUrl(file.path)
    const publicUrl = urlData.publicUrl
    const usedIn: string[] = []

    for (const s of settings) {
      if (typeof s.value === 'string' && s.value === publicUrl) {
        usedIn.push(`Platform Setting: ${s.key}`)
      }
    }

    results.set(file.id, { inUse: usedIn.length > 0, usedIn })
  }

  return results
}
