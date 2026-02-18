'use client'

import { useTranslations, useFormatter } from 'next-intl'
import { MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import { cn } from '@/lib/utils'
import type { OrgUser } from '../actions'

interface UserCardProps {
  user: OrgUser
  onEdit: () => void
  onChangeRole: () => void
  onDeactivate?: () => void
  onReactivate?: () => void
  onRemove: () => void
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  org_admin: 'default',
  manager: 'secondary',
  member: 'outline',
}

export function UserCard({
  user,
  onEdit,
  onChangeRole,
  onDeactivate,
  onReactivate,
  onRemove,
}: UserCardProps) {
  const t = useTranslations('org.users')
  const format = useFormatter()
  const isDeactivated = user.status === 'deactivated'

  const displayName = user.fullName || user.email

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-4 transition-colors',
        isDeactivated && 'opacity-60'
      )}
    >
      <AvatarDisplay
        name={user.fullName}
        email={user.email}
        avatarUrl={user.avatarUrl}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">
            {displayName}
            {user.isCurrentUser && (
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                {t('you')}
              </span>
            )}
          </p>
          <Badge variant={roleBadgeVariant[user.role] || 'outline'} className="shrink-0">
            {t(`roles.${user.role}`)}
          </Badge>
          {isDeactivated && (
            <Badge variant="destructive" className="shrink-0">
              {t('status.deactivated')}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground truncate text-sm">{user.email}</p>
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
          {user.position && <span>{user.position}</span>}
          {user.department && <span>{user.department.name}</span>}
          {user.location && <span>{user.location.name}</span>}
          {user.joinedAt && !isDeactivated && (
            <span>
              {t('joinedAt', { date: format.dateTime(new Date(user.joinedAt), { dateStyle: 'medium' }) })}
            </span>
          )}
          {isDeactivated && user.deactivatedAt && (
            <span>
              {t('deactivatedAt', { date: format.dateTime(new Date(user.deactivatedAt), { dateStyle: 'medium' }) })}
            </span>
          )}
        </div>
      </div>

      {!user.isCurrentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onChangeRole}>
              {t('actions.changeRole')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isDeactivated ? (
              <DropdownMenuItem onClick={onReactivate}>
                {t('actions.reactivate')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onDeactivate}>
                {t('actions.deactivate')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={onRemove}
              className="text-destructive focus:text-destructive"
            >
              {t('actions.remove')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
