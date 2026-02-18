'use client'

import { AlertTriangle } from 'lucide-react'
import { getContrastRatio } from '@/lib/branding/color-utils'

export interface BrandingPreviewProps {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  logoUrl?: string | null
  orgName: string
}

export function BrandingPreview({
  primaryColor,
  accentColor,
  backgroundColor,
  textColor,
  logoUrl,
  orgName,
}: BrandingPreviewProps) {
  const contrastBodyOk = getContrastRatio(textColor, backgroundColor) >= 4.5
  const contrastButtonOk = getContrastRatio('#ffffff', primaryColor) >= 3.0

  const sidebarBg = darkenHex(backgroundColor, 0.06)

  return (
    <div className="space-y-3">
      {/* Mini preview */}
      <div
        className="overflow-hidden rounded-lg border shadow-sm text-xs"
        style={{ backgroundColor, color: textColor }}
      >
        {/* Sidebar + Content */}
        <div className="flex h-40">
          {/* Sidebar */}
          <div
            className="flex w-28 flex-col gap-1 p-2"
            style={{ backgroundColor: sidebarBg }}
          >
            {/* Logo / Org name */}
            <div className="mb-2 flex items-center gap-1.5 px-1">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-4 max-w-[60px] object-contain" />
              ) : (
                <span className="font-bold text-[10px] truncate" style={{ color: primaryColor }}>
                  {orgName}
                </span>
              )}
            </div>

            {/* Nav items */}
            {['Dashboard', 'Analysen', 'Mitarbeiter'].map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-1.5 rounded px-2 py-1"
                style={
                  i === 0
                    ? { backgroundColor: primaryColor, color: '#fff' }
                    : { color: textColor, opacity: 0.7 }
                }
              >
                <div
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: i === 0 ? '#fff' : primaryColor, opacity: i === 0 ? 1 : 0.5 }}
                />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 space-y-2">
            <div className="text-[10px] font-semibold" style={{ color: textColor }}>
              Seiteninhalt
            </div>
            {/* Buttons */}
            <div className="flex gap-1.5">
              <button
                className="rounded px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Primär
              </button>
              <button
                className="rounded px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: accentColor }}
              >
                Akzent
              </button>
            </div>
            {/* Card */}
            <div
              className="rounded border p-2 text-[10px]"
              style={{ borderColor: `${textColor}20`, color: textColor }}
            >
              <span className="font-medium">Karte</span>
              <p style={{ opacity: 0.6 }}>Beispieltext</p>
            </div>
          </div>
        </div>
      </div>

      {/* WCAG warnings */}
      {(!contrastBodyOk || !contrastButtonOk) && (
        <div className="space-y-1.5">
          {!contrastBodyOk && (
            <div className="flex items-start gap-2 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-400">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Der Kontrast zwischen Text- und Hintergrundfarbe ist zu gering für gute Lesbarkeit (WCAG AA: ≥ 4,5:1).
              </span>
            </div>
          )}
          {!contrastButtonOk && (
            <div className="flex items-start gap-2 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-400">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Weißer Text auf der Primärfarbe hat zu wenig Kontrast (WCAG AA für Button-Text: ≥ 3:1).
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Darken a hex color by mixing with black at `amount` (0–1) */
function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = Math.max(0, parseInt(clean.slice(0, 2), 16) - Math.round(255 * amount))
  const g = Math.max(0, parseInt(clean.slice(2, 4), 16) - Math.round(255 * amount))
  const b = Math.max(0, parseInt(clean.slice(4, 6), 16) - Math.round(255 * amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
