'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { deleteGuide } from '../actions'

interface DeleteGuideDialogProps {
  guide: { id: string; name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteGuideDialog({
  guide,
  open,
  onOpenChange,
}: DeleteGuideDialogProps) {
  const t = useTranslations('org.guides.delete')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!guide) return
    setLoading(true)
    const result = await deleteGuide(guide.id)
    setLoading(false)

    if (result.success) {
      toast.success(t('success'))
      onOpenChange(false)
    } else {
      toast.error(t('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {guide ? t('description', { name: guide.name }) : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? tCommon('loading') : t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
