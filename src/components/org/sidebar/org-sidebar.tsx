'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { orgSidebarConfig } from './org-sidebar-config'
import { OrgSidebarGroup } from './org-sidebar-group'


const STORAGE_KEY = 'org-sidebar-collapsed'

interface OrgSidebarProps {
  logoUrl?: string
  orgName?: string | null
  user: {
    displayName: string | null
    email: string
    avatarUrl: string | null
    orgRole: string | null
  }
}

export function OrgSidebar({ logoUrl, orgName, user }: OrgSidebarProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()

  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  // Load collapsed state from localStorage after hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCollapsedKeys(new Set(JSON.parse(stored)))
    } catch {}
    setHydrated(true)
  }, [])

  // Auto-open collapsibles when a child path is active
  useEffect(() => {
    for (const group of orgSidebarConfig) {
      for (const item of group.items) {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => {
            const fullHref = `/${locale}${child.href}`
            return pathname === fullHref || pathname.startsWith(fullHref + '/')
          })
          if (hasActiveChild && collapsedKeys.has(item.key)) {
            setCollapsedKeys((prev) => {
              const next = new Set(prev)
              next.delete(item.key)
              return next
            })
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, locale])

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsedKeys]))
    } catch {
      // Ignore storage errors
    }
  }, [collapsedKeys])

  const toggleCollapse = useCallback((key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Header / Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              className="max-h-10 max-w-[150px] object-contain"
            />
          ) : (
            <span className="text-xl font-bold tracking-tight">{orgName || 'Anivise'}</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        {orgSidebarConfig.map((group) => (
          <OrgSidebarGroup
            key={group.key}
            group={group}
            locale={locale}
            pathname={pathname}
            userRole={user.orgRole}
            collapsedKeys={collapsedKeys}
            onToggleCollapse={toggleCollapse}
          />
        ))}
      </nav>

      {/* User info moved to header */}
    </div>
  )
}
