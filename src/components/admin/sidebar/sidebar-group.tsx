'use client'

import { useTranslations } from 'next-intl'
import type { SidebarGroup as SidebarGroupType } from './sidebar-config'
import { SidebarNavItem } from './sidebar-item'
import { SidebarCollapsible } from './sidebar-collapsible'

interface SidebarGroupProps {
  group: SidebarGroupType
  locale: string
  pathname: string
  isSuperadmin: boolean
  unreadCount: number
  collapsedKeys: Set<string>
  onToggleCollapse: (key: string) => void
}

export function SidebarGroup({
  group,
  locale,
  pathname,
  isSuperadmin,
  unreadCount,
  collapsedKeys,
  onToggleCollapse,
}: SidebarGroupProps) {
  const t = useTranslations()

  const visibleItems = group.items.filter(
    (item) => !item.requiredRole || isSuperadmin
  )

  if (visibleItems.length === 0) return null

  return (
    <div>
      {group.labelKey && (
        <p className="text-muted-foreground px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider">
          {t(group.labelKey)}
        </p>
      )}
      <div className="space-y-0.5">
        {visibleItems.map((item) => {
          if (item.children && item.children.length > 0) {
            return (
              <SidebarCollapsible
                key={item.key}
                item={item}
                locale={locale}
                pathname={pathname}
                isOpen={!collapsedKeys.has(item.key)}
                onToggle={() => onToggleCollapse(item.key)}
              />
            )
          }
          return (
            <SidebarNavItem
              key={item.key}
              item={item}
              locale={locale}
              pathname={pathname}
              unreadCount={item.badge === 'notifications' ? unreadCount : 0}
            />
          )
        })}
      </div>
    </div>
  )
}
