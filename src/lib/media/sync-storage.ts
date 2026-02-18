import { db } from '@/lib/db'
import { mediaFiles } from '@/lib/db/schema'
import { createAdminClient } from '@/lib/supabase/admin'
import { eq, and } from 'drizzle-orm'
import { MEDIA_BUCKET } from './storage-paths'

interface SyncResult {
  added: number
  removed: number
  errors: string[]
}

/**
 * Sync media_files table with Supabase Storage.
 * - Files in storage but not in DB → add tracking entries (as "general" context)
 * - Files in DB but not in storage → remove DB entries
 */
export async function syncMediaStorage(userId: string): Promise<SyncResult> {
  const supabase = createAdminClient()
  const result: SyncResult = { added: 0, removed: 0, errors: [] }

  // List all files in the media/ prefix
  const { data: storageFiles, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list('media', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

  if (error) {
    result.errors.push(`Failed to list storage: ${error.message}`)
    return result
  }

  // Recursively list sub-folders
  const allStoragePaths: Set<string> = new Set()

  async function listRecursive(prefix: string) {
    const { data, error: listErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list(prefix, { limit: 1000 })

    if (listErr) {
      result.errors.push(`Failed to list ${prefix}: ${listErr.message}`)
      return
    }

    for (const item of data ?? []) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name
      if (item.metadata) {
        // It's a file
        allStoragePaths.add(fullPath)
      } else {
        // It's a folder — recurse
        await listRecursive(fullPath)
      }
    }
  }

  await listRecursive('media')

  // Also include root-level files (email-logo, etc.)
  const { data: rootFiles } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list('', { limit: 1000 })

  for (const f of rootFiles ?? []) {
    if (f.metadata) {
      allStoragePaths.add(f.name)
    }
  }

  // Get all DB entries for this bucket
  const dbFiles = await db
    .select({ id: mediaFiles.id, path: mediaFiles.path })
    .from(mediaFiles)
    .where(eq(mediaFiles.bucket, MEDIA_BUCKET))

  const dbPathMap = new Map(dbFiles.map((f) => [f.path, f.id]))

  // Files in storage but not in DB → add
  for (const storagePath of allStoragePaths) {
    if (!dbPathMap.has(storagePath)) {
      const filename = storagePath.split('/').pop() ?? storagePath
      // Try to get file metadata
      const { data: meta } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(storagePath.substring(0, storagePath.lastIndexOf('/')), {
          search: filename,
        })

      const fileMeta = meta?.find((m) => m.name === filename)

      await db.insert(mediaFiles).values({
        bucket: MEDIA_BUCKET,
        path: storagePath,
        filename,
        mimeType: fileMeta?.metadata?.mimetype ?? 'application/octet-stream',
        size: fileMeta?.metadata?.size ?? 0,
        context: 'general',
        uploadedBy: userId,
      })
      result.added++
    }
  }

  // Files in DB but not in storage → remove
  for (const [path, id] of dbPathMap) {
    if (!allStoragePaths.has(path)) {
      await db
        .delete(mediaFiles)
        .where(and(eq(mediaFiles.id, id), eq(mediaFiles.bucket, MEDIA_BUCKET)))
      result.removed++
    }
  }

  return result
}
