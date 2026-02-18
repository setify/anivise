'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { adminSidebarConfig } from './sidebar-config'
import { SidebarGroup } from './sidebar-group'
import { getUnreadCount } from '@/app/[locale]/(superadmin)/admin/actions'

const STORAGE_KEY = 'admin-sidebar-collapsed'

interface AdminSidebarProps {
  platformRole?: string | null
  logoUrl?: string
  user: {
    displayName: string | null
    email: string
    avatarUrl: string | null
    platformRole: string | null
  }
}

export function AdminSidebar({ platformRole, logoUrl, user }: AdminSidebarProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const isSuperadmin = platformRole === 'superadmin'

  // Collapse state: keys in this set are collapsed (closed)
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Auto-open collapsibles when a child path is active
  useEffect(() => {
    for (const group of adminSidebarConfig) {
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
    // Only run on pathname changes, not on collapsedKeys changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, locale])

  // Persist collapsed state to localStorage
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

  // Notification badge polling
  useEffect(() => {
    const load = async () => {
      const count = await getUnreadCount()
      setUnreadCount(count)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Header / Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <Link href={`/${locale}/admin`} className="flex items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              className="max-h-10 max-w-[150px] object-contain"
            />
          ) : (
            <span className="text-xl font-bold tracking-tight">Anivise</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {adminSidebarConfig.map((group) => (
          <SidebarGroup
            key={group.key}
            group={group}
            locale={locale}
            pathname={pathname}
            isSuperadmin={isSuperadmin}
            unreadCount={unreadCount}
            collapsedKeys={collapsedKeys}
            onToggleCollapse={toggleCollapse}
          />
        ))}
      </nav>

      {/* User info moved to header – no footer needed */}
    </div>
  )
}
