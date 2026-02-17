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

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function Sidebar() {
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
          {t('organization')}
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
                  ? 'bg-accent text-accent-foreground'
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
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{t('user')}</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="size-4" />
            <span className="sr-only">{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
