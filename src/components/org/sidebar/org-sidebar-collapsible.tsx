'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrgSidebarItem } from './org-sidebar-config'
import { hasMinRole } from './org-sidebar-config'
import { OrgSidebarNavItem, isItemActive } from './org-sidebar-item'

interface OrgSidebarCollapsibleProps {
  item: OrgSidebarItem
  locale: string
  pathname: string
  isOpen: boolean
  onToggle: () => void
  userRole: string | null
}

export function OrgSidebarCollapsible({
  item,
  locale,
  pathname,
  isOpen,
  onToggle,
  userRole,
}: OrgSidebarCollapsibleProps) {
  const t = useTranslations()

  // Filter children by role
  const visibleChildren = (item.children ?? []).filter(
    (child) => !child.minRole || hasMinRole(userRole, child.minRole)
  )

  // If only 1 child visible, render as flat link instead of collapsible
  if (visibleChildren.length <= 1) {
    const target = visibleChildren[0] ?? item
    return (
      <OrgSidebarNavItem
        item={{ ...item, href: target.href }}
        locale={locale}
        pathname={pathname}
      />
    )
  }

  const hasActiveChild = visibleChildren.some((child) =>
    isItemActive(pathname, child.href, locale, true)
  )

  const fullHref = `/${locale}${item.href}`
  const isParentActive = isItemActive(pathname, item.href, locale, false)

  return (
    <div>
      <Link
        href={fullHref}
        onClick={onToggle}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
          hasActiveChild || isParentActive
            ? 'bg-accent/50 text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        {(hasActiveChild || isParentActive) && (
          <span className="bg-primary/40 absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full" />
        )}
        <item.icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{t(item.labelKey)}</span>
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform duration-200',
            !isOpen && '-rotate-90'
          )}
        />
      </Link>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-out',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-muted-foreground/20 ml-[18px] mt-1 space-y-0.5 border-l pl-3">
          {visibleChildren.map((child) => (
            <OrgSidebarNavItem
              key={child.key}
              item={child}
              locale={locale}
              pathname={pathname}
              isChild
            />
          ))}
        </div>
      </div>
    </div>
  )
}
