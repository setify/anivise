'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronRight } from 'lucide-react'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'title',
  profile: 'profile.title',
  team: 'team.title',
  organizations: 'orgs.title',
  jobs: 'jobs.title',
  notifications: 'notifications.title',
  activity: 'activity.title',
  settings: 'platformSettings.title',
  emails: 'emailTemplates.title',
  new: 'orgs.createOrg',
}

export function AdminBreadcrumbs() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('admin')

  // Extract path segments after /{locale}/admin
  const prefix = `/${locale}/admin`
  if (!pathname.startsWith(prefix)) return null

  const rest = pathname.slice(prefix.length)
  if (!rest || rest === '/') return null

  const segments = rest.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const crumbs: { label: string; href: string }[] = []
  let currentPath = prefix

  for (const segment of segments) {
    currentPath += `/${segment}`

    // Skip UUID segments (org detail pages etc.) - show them truncated
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

    if (isUuid) {
      crumbs.push({
        label: segment.slice(0, 8) + '...',
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
    <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Breadcrumb">
      <Link
        href={prefix}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('title')}
      </Link>
      {crumbs.map((crumb, i) => (
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
      ))}
    </nav>
  )
}
