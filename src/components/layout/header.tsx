'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Menu, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DashboardBreadcrumbs } from '@/components/layout/dashboard-breadcrumbs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

interface UserInfo {
  displayName: string | null
  email: string
  avatarUrl: string | null
  orgRole: string | null
}

interface HeaderProps {
  onMobileMenuToggle: () => void
  user?: UserInfo | null
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return email[0]?.toUpperCase() ?? 'U'
}

const ROLE_LABELS: Record<string, string> = {
  org_admin: 'Admin',
  manager: 'Manager',
  member: 'Mitglied',
}

export function Header({ onMobileMenuToggle, user }: HeaderProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  const roleLabel = user?.orgRole ? (ROLE_LABELS[user.orgRole] ?? user.orgRole) : null

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4 backdrop-blur lg:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="size-5" />
        <span className="sr-only">{t('menu')}</span>
      </Button>

      <DashboardBreadcrumbs />
      <div className="flex-1" />

      <ThemeToggle />

      {/* User info + Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent focus:outline-none">
            <Avatar size="sm">
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.displayName || user.email} />
              )}
              <AvatarFallback className="text-xs">
                {getInitials(user?.displayName ?? null, user?.email ?? '')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:flex lg:flex-col lg:items-start">
              <span className="max-w-[140px] truncate text-sm font-medium leading-tight">
                {user?.displayName || user?.email || t('user')}
              </span>
              {roleLabel && (
                <Badge variant="outline" className="mt-0.5 h-4 px-1.5 text-[10px] font-normal">
                  {roleLabel}
                </Badge>
              )}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-medium">{user?.displayName || user?.email || t('user')}</span>
            {user?.email && user.displayName && (
              <span className="text-muted-foreground truncate text-xs font-normal">
                {user.email}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/settings`}>
              <User className="mr-2 size-4" />
              Einstellungen
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 size-4" />
            {t('logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
