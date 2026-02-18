/**
 * Centralized Supabase Storage bucket/path configuration for the media library.
 */

export const MEDIA_BUCKET = 'platform-assets'

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
  'image/gif',
  'application/pdf',
]

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

/** Build a storage path for a media upload based on context. */
export function buildStoragePath(
  context: string,
  filename: string,
  entityId?: string
): string {
  const timestamp = Date.now()
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const base = entityId ? `media/${context}/${entityId}` : `media/${context}`
  return `${base}/${timestamp}-${safeName}`
}
