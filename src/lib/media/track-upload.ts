import { db } from '@/lib/db'
import { mediaFiles } from '@/lib/db/schema'
import type { MediaContext } from '@/types/database'

/** Insert a media_files record after a successful Supabase Storage upload. */
export async function trackUpload(params: {
  bucket: string
  path: string
  filename: string
  mimeType: string
  size: number
  context: MediaContext
  contextEntityId?: string
  uploadedBy: string
  altText?: string
}): Promise<string> {
  const [row] = await db
    .insert(mediaFiles)
    .values({
      bucket: params.bucket,
      path: params.path,
      filename: params.filename,
      mimeType: params.mimeType,
      size: params.size,
      context: params.context,
      contextEntityId: params.contextEntityId ?? null,
      uploadedBy: params.uploadedBy,
      altText: params.altText ?? null,
    })
    .returning({ id: mediaFiles.id })

  return row.id
}
