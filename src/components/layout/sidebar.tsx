'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  ClipboardList,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface SidebarProps {
  user?: { displayName: string | null; email: string; avatarUrl: string | null } | null
  orgName?: string | null
}

export function Sidebar({ user, orgName }: SidebarProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      href: `/${locale}/dashboard`,
      label: t('dashboard'),
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/analyses`,
      label: t('analyses'),
      icon: BarChart3,
    },
    {
      href: `/${locale}/forms`,
      label: t('forms'),
      icon: ClipboardList,
    },
    {
      href: `/${locale}/team`,
      label: t('team'),
      icon: Users,
    },
    {
      href: `/${locale}/plan`,
      label: t('plan'),
      icon: CreditCard,
    },
    {
      href: `/${locale}/settings`,
      label: t('settings'),
      icon: Settings,
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
          <span className="text-lg font-semibold">Anivise</span>
        </Link>
      </div>

      <div className="px-3 py-2">
        <p className="text-muted-foreground truncate px-2 text-xs font-medium uppercase tracking-wider">
          {orgName || t('organization')}
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground nav-link-active'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar size="sm">
            <AvatarFallback>
              {user?.displayName
                ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">
              {user?.displayName || user?.email || t('user')}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground shrink-0">
            <LogOut className="size-4" />
            <span className="sr-only">{t('logout')}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
