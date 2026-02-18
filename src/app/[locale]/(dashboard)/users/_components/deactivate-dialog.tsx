'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deactivateUser, reactivateUser } from '../actions'
import type { OrgUser } from '../actions'

interface DeactivateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: OrgUser
}

export function DeactivateDialog({ open, onOpenChange, user }: DeactivateDialogProps) {
  const isDeactivated = user.status === 'deactivated'
  const td = useTranslations('org.users.deactivateDialog')
  const tr = useTranslations('org.users.reactivateDialog')
  const tc = useTranslations('common')
  const t = isDeactivated ? tr : td
  const [loading, setLoading] = useState(false)

  const displayName = user.fullName || user.email

  async function handleSubmit() {
    setLoading(true)
    const form = new FormData()
    form.set('memberId', user.id)

    const result = isDeactivated
      ? await reactivateUser(form)
      : await deactivateUser(form)
    setLoading(false)

    if (result.success) {
      toast.success(isDeactivated ? t('reactivated') : t('deactivated'))
      onOpenChange(false)
    } else if (result.error === 'last_admin') {
      toast.error(t('lastAdminWarning'))
    } else if (result.error === 'seat_limit_reached') {
      toast.error(t('noSeatAvailable'))
    } else {
      toast.error(t('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { name: displayName })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isDeactivated && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('consequences')}</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>{t('consequence1')}</li>
                <li>{t('consequence2')}</li>
                <li>{t('consequence3')}</li>
                <li>{t('consequence4')}</li>
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {tc('cancel')}
            </Button>
            <Button
              variant={isDeactivated ? 'default' : 'destructive'}
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? (isDeactivated ? t('reactivating') : t('deactivating'))
                : (isDeactivated ? t('reactivateButton') : t('deactivateButton'))}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
