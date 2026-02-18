'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

interface OrgSidebarUserFooterProps {
  user: {
    displayName: string | null
    email: string
    avatarUrl: string | null
    orgRole: string | null
  }
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0].toUpperCase()
}

export function OrgSidebarUserFooter({ user }: OrgSidebarUserFooterProps) {
  const t = useTranslations('org.sidebar.userFooter')
  const locale = useLocale()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  const roleLabel = user.orgRole
    ? t(`roles.${user.orgRole}` as 'roles.org_admin' | 'roles.manager' | 'roles.member')
    : null

  return (
    <div className="border-t">
      <div className="p-3">
        <div className="flex items-center gap-3 px-1">
          <Avatar size="default">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.displayName || user.email} />
            )}
            <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.displayName || user.email}
            </p>
            {roleLabel && (
              <Badge variant="outline" className="mt-0.5 h-4 px-1.5 text-[10px] font-normal">
                {roleLabel}
              </Badge>
            )}
          </div>
        </div>

        <Separator className="my-2" />

        <div className="flex items-center gap-1">
          <Link
            href={`/${locale}/settings`}
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
          >
            <User className="size-3" />
            {t('profile')}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
          >
            <LogOut className="size-3" />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  )
}
