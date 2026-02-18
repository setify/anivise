'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { OrgSidebarItem } from './org-sidebar-config'

interface OrgSidebarNavItemProps {
  item: OrgSidebarItem
  locale: string
  pathname: string
  isChild?: boolean
}

function isItemActive(pathname: string, href: string, locale: string, exact?: boolean) {
  const fullHref = `/${locale}${href}`
  if (exact || href === '/dashboard') {
    return pathname === fullHref
  }
  return pathname === fullHref || pathname.startsWith(fullHref + '/')
}

export function OrgSidebarNavItem({
  item,
  locale,
  pathname,
  isChild = false,
}: OrgSidebarNavItemProps) {
  const t = useTranslations()
  const active = isItemActive(pathname, item.href, locale, isChild)

  return (
    <Link
      href={`/${locale}${item.href}`}
      className={cn(
        'group relative flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
        isChild && 'py-1.5 text-[13px]',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {active && (
        <span className="bg-primary absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full" />
      )}

      <item.icon className={cn('shrink-0', isChild ? 'size-3.5' : 'size-4')} />
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
    </Link>
  )
}

export { isItemActive }
