'use client'

import { useState } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import { toast } from 'sonner'
import { resendInvitation, revokeInvitation } from '../actions'
import type { OrgInvitation } from '../actions'

interface InvitationCardProps {
  invitation: OrgInvitation
}

export function InvitationCard({ invitation }: InvitationCardProps) {
  const t = useTranslations('org.users')
  const format = useFormatter()
  const [loading, setLoading] = useState(false)

  const isExpired =
    invitation.status === 'expired' || new Date(invitation.expiresAt) < new Date()

  const displayName = [invitation.invitedFirstName, invitation.invitedLastName]
    .filter(Boolean)
    .join(' ') || invitation.email

  async function handleResend() {
    setLoading(true)
    const result = await resendInvitation(invitation.id)
    setLoading(false)
    if (result.success) {
      toast.success(t('invitation.resent'))
    } else {
      toast.error(t('invitation.error'))
    }
  }

  async function handleRevoke() {
    setLoading(true)
    const result = await revokeInvitation(invitation.id)
    setLoading(false)
    if (result.success) {
      toast.success(t('invitation.revoked'))
    } else {
      toast.error(t('invitation.error'))
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-dashed p-4">
      <AvatarDisplay name={displayName} email={invitation.email} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{displayName}</p>
          {invitation.targetOrgRole && (
            <Badge variant="outline" className="shrink-0">
              {t(`roles.${invitation.targetOrgRole}`)}
            </Badge>
          )}
          <Badge
            variant={isExpired ? 'destructive' : 'secondary'}
            className="shrink-0"
          >
            {isExpired ? t('expired') : t('invitation.status.pending')}
          </Badge>
        </div>
        <p className="text-muted-foreground truncate text-sm">{invitation.email}</p>
        <div className="text-muted-foreground mt-1 text-xs">
          {t('invitedAt', {
            date: format.dateTime(new Date(invitation.createdAt), { dateStyle: 'medium' }),
          })}
          {' · '}
          {t('expiresAt', {
            date: format.dateTime(new Date(invitation.expiresAt), { dateStyle: 'medium' }),
          })}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0" disabled={loading}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleResend}>
            {t('actions.resendInvitation')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleRevoke}
            className="text-destructive focus:text-destructive"
          >
            {t('actions.revokeInvitation')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
