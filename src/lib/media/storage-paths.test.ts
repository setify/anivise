import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  MEDIA_BUCKET,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  buildStoragePath,
} from './storage-paths'

describe('storage-paths', () => {
  describe('constants', () => {
    it('MEDIA_BUCKET should be "platform-assets"', () => {
      expect(MEDIA_BUCKET).toBe('platform-assets')
    })

    it('MAX_FILE_SIZE should be 5 MB (5 * 1024 * 1024)', () => {
      expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024)
      expect(MAX_FILE_SIZE).toBe(5_242_880)
    })

    it('ALLOWED_MIME_TYPES should include common image types and PDF', () => {
      expect(ALLOWED_MIME_TYPES).toContain('image/png')
      expect(ALLOWED_MIME_TYPES).toContain('image/jpeg')
      expect(ALLOWED_MIME_TYPES).toContain('image/svg+xml')
      expect(ALLOWED_MIME_TYPES).toContain('image/webp')
      expect(ALLOWED_MIME_TYPES).toContain('image/gif')
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf')
    })

    it('ALLOWED_MIME_TYPES should have exactly 6 entries', () => {
      expect(ALLOWED_MIME_TYPES).toHaveLength(6)
    })
  })

  describe('buildStoragePath', () => {
    let dateSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    })

    afterEach(() => {
      dateSpy.mockRestore()
    })

    it('should build a path with context and filename (no entityId)', () => {
      const result = buildStoragePath('logos', 'my-logo.png')
      expect(result).toBe('media/logos/1700000000000-my-logo.png')
    })

    it('should build a path with context, entityId, and filename', () => {
      const result = buildStoragePath('logos', 'my-logo.png', 'abc-123')
      expect(result).toBe('media/logos/abc-123/1700000000000-my-logo.png')
    })

    it('should sanitize unsafe characters in filename', () => {
      const result = buildStoragePath('uploads', 'my file (1).png')
      expect(result).toBe('media/uploads/1700000000000-my_file__1_.png')
    })

    it('should keep safe characters in filename (dots, hyphens, underscores)', () => {
      const result = buildStoragePath('uploads', 'image-2024_01.test.png')
      expect(result).toBe('media/uploads/1700000000000-image-2024_01.test.png')
    })

    it('should replace all spaces and special characters', () => {
      const result = buildStoragePath('docs', 'hello world!@#$%.pdf')
      expect(result).toBe('media/docs/1700000000000-hello_world_____.pdf')
    })

    it('should handle empty entityId by omitting the segment', () => {
      const result = buildStoragePath('avatars', 'photo.jpg', undefined)
      expect(result).toBe('media/avatars/1700000000000-photo.jpg')
    })

    it('should include entityId segment when provided', () => {
      const result = buildStoragePath('avatars', 'photo.jpg', 'user-42')
      expect(result).toBe('media/avatars/user-42/1700000000000-photo.jpg')
    })

    it('should handle filenames with only special characters', () => {
      const result = buildStoragePath('test', '!!!.png')
      expect(result).toBe('media/test/1700000000000-___.png')
    })
  })
})
