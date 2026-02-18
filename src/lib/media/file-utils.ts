/** Format bytes into a human-readable string. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Check if a MIME type represents an image. */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/** Get a display-friendly file extension from a filename. */
export function getExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase() : ''
}
