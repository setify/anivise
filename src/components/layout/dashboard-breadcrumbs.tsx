'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronRight } from 'lucide-react'

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'dashboard',
  analyses: 'analyses',
  team: 'team',
  settings: 'settings',
  forms: 'forms',
  plan: 'plan',
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('nav')

  // Dashboard pages live under /{locale}/ directly (no /dashboard prefix group)
  const prefix = `/${locale}`
  if (!pathname.startsWith(prefix)) return null

  const rest = pathname.slice(prefix.length)
  if (!rest || rest === '/' || rest === '/dashboard') return null

  const segments = rest.split('/').filter(Boolean)
  if (segments.length === 0) return null

  // Only render for known dashboard segments
  const firstSegment = segments[0]
  if (!SEGMENT_LABELS[firstSegment]) return null

  const crumbs: { label: string; href: string }[] = []
  let currentPath = prefix

  for (const segment of segments) {
    currentPath += `/${segment}`

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        segment
      )
    const isSlug = !isUuid && !SEGMENT_LABELS[segment]

    if (isUuid) {
      crumbs.push({
        label: segment.slice(0, 8) + '...',
        href: currentPath,
      })
    } else if (isSlug) {
      crumbs.push({
        label: decodeURIComponent(segment),
        href: currentPath,
      })
    } else {
      const labelKey = SEGMENT_LABELS[segment]
      crumbs.push({
        label: labelKey ? t(labelKey) : segment,
        href: currentPath,
      })
    }
  }

  return (
    <nav
      className="hidden items-center gap-1 text-sm md:flex"
      aria-label="Breadcrumb"
    >
      <Link
        href={`${prefix}/dashboard`}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('dashboard')}
      </Link>
      {crumbs.map((crumb, i) => {
        // Skip "dashboard" since it's already the root
        if (i === 0 && crumb.label === t('dashboard')) return null
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="text-muted-foreground size-3" />
            {i === crumbs.length - 1 ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
