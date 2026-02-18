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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { removeUserFromOrg } from '../actions'
import type { OrgUser } from '../actions'

interface RemoveUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: OrgUser
}

export function RemoveUserDialog({ open, onOpenChange, user }: RemoveUserDialogProps) {
  const t = useTranslations('org.users.removeDialog')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  const displayName = user.fullName || user.email
  const isMatch = confirmName === displayName

  async function handleSubmit() {
    if (!isMatch) return
    setLoading(true)
    const form = new FormData()
    form.set('memberId', user.id)
    form.set('confirmName', confirmName)

    const result = await removeUserFromOrg(form)
    setLoading(false)

    if (result.success) {
      toast.success(t('removed'))
      onOpenChange(false)
    } else if (result.error === 'last_admin') {
      toast.error(t('lastAdminWarning'))
    } else if (result.error === 'name_mismatch') {
      toast.error(t('confirmMismatch'))
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
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('consequences')}</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>{t('consequence1')}</li>
              <li>{t('consequence2')}</li>
              <li>{t('consequence3')}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label>{t('confirmLabel')}</Label>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={t('confirmPlaceholder')}
            />
            {confirmName && !isMatch && (
              <p className="text-destructive text-xs">{t('confirmMismatch')}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !isMatch}
            >
              {loading ? t('removing') : t('removeButton')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
