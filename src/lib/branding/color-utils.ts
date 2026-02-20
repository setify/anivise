/**
 * Color utility functions for org branding.
 * Converts between Hex and HSL (for shadcn/ui CSS variable compatibility),
 * and provides WCAG contrast checking.
 */

/** Parse a hex color string to RGB components [0–255] */
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return [r, g, b]
}

/**
 * Convert a hex color to HSL string for shadcn/ui CSS variables.
 * Returns "H S% L%" — e.g. "#6366f1" → "239 84% 67%"
 */
export function hexToHsl(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '0 0% 50%'

  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / delta + 2) / 6
        break
      case b:
        h = ((r - g) / delta + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Convert RGB component [0–1] to linear light */
function toLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** Calculate relative luminance of a hex color (WCAG 2.1) */
function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((c) => toLinear(c / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 * Returns a number from 1 (no contrast) to 21 (max contrast).
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1)
  const l2 = relativeLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if two colors meet WCAG AA for normal text (contrast ratio ≥ 4.5:1).
 */
export function meetsWCAG_AA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5
}

/**
 * Return a foreground color (white or dark) that has good contrast
 * against the given hex background color.
 */
export function getContrastForeground(bgHex: string): string {
  const lum = relativeLuminance(bgHex)
  // Luminance > 0.4 → background is light → use dark text
  return lum > 0.4 ? '#09090b' : '#fafafa'
}

/** Validate a hex color string (#rrggbb) */
export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

/** Ensure a hex string starts with # */
export function normalizeHex(hex: string): string {
  const s = hex.trim()
  return s.startsWith('#') ? s : `#${s}`
}
