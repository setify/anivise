import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn (class name merger)', () => {
    it('should merge single class strings', () => {
      expect(cn('foo')).toBe('foo')
    })

    it('should merge multiple class strings', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', false && 'hidden', true && 'visible')).toBe(
        'base visible'
      )
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })

    it('should merge conflicting Tailwind classes (last wins)', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })

    it('should merge conflicting Tailwind color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })

    it('should handle array inputs via clsx', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle object inputs via clsx', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('should handle complex Tailwind conflicts', () => {
      expect(cn('px-4 py-2', 'px-2')).toBe('py-2 px-2')
    })
  })
})
