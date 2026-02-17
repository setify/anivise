'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { NotificationBell } from '@/components/admin/notification-bell'
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs'
import { PageTransition } from '@/components/ui/page-transition'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

export function AdminLayoutClient({
  children,
  platformRole,
}: {
  children: React.ReactNode
  platformRole: string | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations('nav')

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 border-r lg:block">
        <AdminSidebar platformRole={platformRole} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
          <AdminSidebar platformRole={platformRole} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-4 backdrop-blur lg:px-6">
          <Button
            variant="ghost"
            size="icon"
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
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
