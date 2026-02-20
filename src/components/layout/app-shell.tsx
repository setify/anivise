'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { OrgSidebar } from '@/components/org/sidebar/org-sidebar'
import { Header } from '@/components/layout/header'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { PageTransition } from '@/components/ui/page-transition'
import { UserContextProvider } from '@/contexts/user-context'
import type { OrgRole, PlatformRole } from '@/lib/auth/roles'

interface UserInfo {
  displayName: string | null
  email: string
  avatarUrl: string | null
  orgRole: string | null
}

interface AppShellProps {
  children: React.ReactNode
  user?: UserInfo | null
  orgName?: string | null
  logoUrl?: string
  platformRole?: PlatformRole | null
}

export function AppShell({ children, user, orgName, logoUrl, platformRole }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations('nav')

  const sidebarUser = user ?? {
    displayName: null,
    email: '',
    avatarUrl: null,
    orgRole: null,
  }

  return (
    <UserContextProvider
      orgRole={(user?.orgRole as OrgRole) ?? null}
      platformRole={platformRole ?? null}
    >
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="bg-sidebar text-sidebar-foreground hidden w-[260px] shrink-0 border-r border-sidebar-border lg:block">
          <OrgSidebar user={sidebarUser} orgName={orgName} logoUrl={logoUrl} />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[260px] p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
            <OrgSidebar user={sidebarUser} orgName={orgName} logoUrl={logoUrl} />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <Header onMobileMenuToggle={() => setMobileOpen(true)} user={user} />
          <main className="main-gradient flex-1 p-4 lg:p-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </UserContextProvider>
  )
}
