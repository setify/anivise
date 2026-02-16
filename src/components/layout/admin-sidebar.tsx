'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  FlaskConical,
  LayoutDashboard,
  Link2,
  Mail,
  Palette,
  Settings,
  User,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getUnreadCount } from '@/app/[locale]/(superadmin)/admin/actions'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  superadminOnly?: boolean
  children?: NavItem[]
}

export function AdminSidebar({ platformRole }: { platformRole?: string | null }) {
  const t = useTranslations('nav')
  const tAdmin = useTranslations('admin')
  const locale = useLocale()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isSuperadmin = platformRole === 'superadmin'

  const loadUnreadCount = async () => {
    const count = await getUnreadCount()
    setUnreadCount(count)
  }

  // Auto-expand settings if we're on a settings page
  useEffect(() => {
    if (pathname.includes('/admin/settings')) {
      setSettingsOpen(true)
    }
  }, [pathname])

  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const navItems: NavItem[] = [
    {
      href: `/${locale}/admin`,
      label: tAdmin('title'),
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/admin/profile`,
      label: tAdmin('profile.title'),
      icon: User,
    },
    {
      href: `/${locale}/admin/team`,
      label: tAdmin('team.title'),
      icon: Users,
      superadminOnly: true,
    },
    {
      href: `/${locale}/admin/organizations`,
      label: tAdmin('orgs.title'),
      icon: Building2,
    },
    {
      href: `/${locale}/admin/jobs`,
      label: tAdmin('jobs.title'),
      icon: FlaskConical,
    },
    {
      href: `/${locale}/admin/integrations`,
      label: tAdmin('integrations.title'),
      icon: Link2,
      superadminOnly: true,
    },
    {
      href: `/${locale}/admin/activity`,
      label: tAdmin('activity.title'),
      icon: Activity,
    },
    {
      href: `/${locale}/admin/notifications`,
      label: tAdmin('notifications.title'),
      icon: Bell,
      badge: unreadCount,
    },
    {
      href: `/${locale}/admin/settings`,
      label: tAdmin('platformSettings.title'),
      icon: Settings,
      superadminOnly: true,
      children: [
        {
          href: `/${locale}/admin/settings`,
          label: tAdmin('platformSettings.tabs.general'),
          icon: Settings,
        },
        {
          href: `/${locale}/admin/settings/email-layout`,
          label: tAdmin('emailLayout.title'),
          icon: Palette,
        },
        {
          href: `/${locale}/admin/settings/emails`,
          label: tAdmin('emailTemplates.title'),
          icon: Mail,
        },
      ],
    },
  ]

  const visibleNavItems = navItems.filter(
    (item) => !item.superadminOnly || isSuperadmin
  )

  function isActive(href: string, exact?: boolean) {
    if (exact || href === `/${locale}/admin`) {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href={`/${locale}/admin`} className="flex items-center gap-2">
          <span className="text-lg font-semibold">Anivise</span>
          <span className="bg-destructive text-destructive-foreground rounded px-1.5 py-0.5 text-xs font-medium">
            {t('admin')}
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {visibleNavItems.map((item) => {
          if (item.children) {
            const parentActive = pathname.includes('/admin/settings')
            return (
              <div key={item.href}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                    parentActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight
                    className={cn(
                      'size-3.5 transition-transform',
                      settingsOpen && 'rotate-90'
                    )}
                  />
                </button>
                {settingsOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                          isActive(child.href, true)
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <child.icon className="size-3.5 shrink-0" />
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <Badge
                  variant="destructive"
                  className="flex size-5 items-center justify-center p-0 text-[10px]"
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href={`/${locale}/dashboard`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-2 py-2 text-sm transition-colors"
        >
          {t('backToDashboard')}
        </Link>
      </div>
    </div>
  )
}
