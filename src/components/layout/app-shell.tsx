'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

interface UserInfo {
  displayName: string | null
  email: string
  avatarUrl: string | null
}

interface AppShellProps {
  children: React.ReactNode
  user?: UserInfo | null
  orgName?: string | null
}

export function AppShell({ children, user, orgName }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations('nav')

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 border-r lg:block">
        <Sidebar user={user} orgName={orgName} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
          <Sidebar user={user} orgName={orgName} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <Header onMobileMenuToggle={() => setMobileOpen(true)} user={user} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
