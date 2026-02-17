'use client'

import { useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DashboardBreadcrumbs } from '@/components/layout/dashboard-breadcrumbs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onMobileMenuToggle: () => void
  user?: { displayName: string | null; email: string; avatarUrl: string | null } | null
}

export function Header({ onMobileMenuToggle, user }: HeaderProps) {
  const t = useTranslations('nav')
  const tSettings = useTranslations('settings')

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-4 backdrop-blur lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="size-5" />
        <span className="sr-only">{t('menu')}</span>
      </Button>

      <DashboardBreadcrumbs />
      <div className="flex-1" />

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar size="sm">
              <AvatarFallback>
                {user?.displayName
                  ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.displayName || user?.email || t('user')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{tSettings('profile')}</DropdownMenuItem>
          <DropdownMenuItem>{tSettings('title')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{t('logout')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
