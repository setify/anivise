'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Building2, LayoutDashboard, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function AdminSidebar() {
  const t = useTranslations('nav')
  const tAdmin = useTranslations('admin')
  const locale = useLocale()
  const pathname = usePathname()

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
    },
    {
      href: `/${locale}/admin/organizations`,
      label: tAdmin('orgs.title'),
      icon: Building2,
    },
  ]

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
        {navItems.map((item) => {
          const isActive =
            item.href === `/${locale}/admin`
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
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
