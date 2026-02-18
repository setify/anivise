'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Menu, LogOut, User } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/sidebar/admin-sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { NotificationBell } from '@/components/admin/notification-bell'
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs'
import { PageTransition } from '@/components/ui/page-transition'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

interface AdminLayoutClientProps {
  children: React.ReactNode
  platformRole: string | null
  logoUrl?: string
  user: {
    displayName: string | null
    email: string
    avatarUrl: string | null
    platformRole: string | null
  }
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return email[0].toUpperCase()
}

function AdminHeaderUser({ user }: { user: AdminLayoutClientProps['user'] }) {
  const t = useTranslations('admin.sidebar.userFooter')
  const locale = useLocale()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  const roleBadge = user.platformRole === 'superadmin' ? 'Administrator' : 'Staff'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent focus:outline-none">
          <Avatar size="sm">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.displayName || user.email} />
            )}
            <AvatarFallback className="text-xs">
              {getInitials(user.displayName, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex lg:flex-col lg:items-start">
            <span className="max-w-[140px] truncate text-sm font-medium leading-tight">
              {user.displayName || user.email}
            </span>
            <Badge variant="outline" className="mt-0.5 h-4 px-1.5 text-[10px] font-normal">
              {roleBadge}
            </Badge>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium">{user.displayName || user.email}</span>
          <span className="text-muted-foreground truncate text-xs font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/admin/profile`}>
            <User className="mr-2 size-4" />
            {t('profile')}
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
  )
}

export function AdminLayoutClient({
  children,
  platformRole,
  logoUrl,
  user,
}: AdminLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations('nav')

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar text-sidebar-foreground hidden w-[260px] shrink-0 border-r border-sidebar-border lg:block">
        <AdminSidebar platformRole={platformRole} logoUrl={logoUrl} user={user} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
          <AdminSidebar platformRole={platformRole} logoUrl={logoUrl} user={user} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header – gleiche Höhe wie Sidebar-Header (h-[57px] = h-14 + border) */}
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4 backdrop-blur lg:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
            <span className="sr-only">{t('menu')}</span>
          </Button>
          <AdminBreadcrumbs />
          <div className="flex-1" />
          <NotificationBell />
          <ThemeToggle />
          <AdminHeaderUser user={user} />
        </header>
        <main className="main-gradient flex-1 p-4 lg:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
