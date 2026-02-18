'use client'

import { useTranslations } from 'next-intl'
import type { OrgSidebarGroup as OrgSidebarGroupType } from './org-sidebar-config'
import { hasMinRole } from './org-sidebar-config'
import { OrgSidebarNavItem } from './org-sidebar-item'
import { OrgSidebarCollapsible } from './org-sidebar-collapsible'

interface OrgSidebarGroupProps {
  group: OrgSidebarGroupType
  locale: string
  pathname: string
  userRole: string | null
  collapsedKeys: Set<string>
  onToggleCollapse: (key: string) => void
}

export function OrgSidebarGroup({
  group,
  locale,
  pathname,
  userRole,
  collapsedKeys,
  onToggleCollapse,
}: OrgSidebarGroupProps) {
  const t = useTranslations()

  const visibleItems = group.items.filter(
    (item) => !item.minRole || hasMinRole(userRole, item.minRole)
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
              <OrgSidebarCollapsible
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
            <OrgSidebarNavItem
              key={item.key}
              item={item}
              locale={locale}
              pathname={pathname}
            />
          )
        })}
      </div>
    </div>
  )
}
