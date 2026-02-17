'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { publishFormWithValidation } from '@/app/[locale]/(superadmin)/admin/forms/actions'

interface PublishValidationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formId: string
  onPublished: () => void
}

export function PublishValidationDialog({
  open,
  onOpenChange,
  formId,
  onPublished,
}: PublishValidationDialogProps) {
  const t = useTranslations('admin.forms.publish')
  const [publishing, setPublishing] = useState(false)
  const [errors, setErrors] = useState<string[] | null>(null)
  const [confirmNewVersion, setConfirmNewVersion] = useState(false)
  const [submissionCount, setSubmissionCount] = useState(0)

  const handlePublish = async () => {
    setPublishing(true)
    setErrors(null)

    try {
      const result = await publishFormWithValidation(formId)

      if (result.validationErrors && result.validationErrors.length > 0) {
        setErrors(result.validationErrors)
        return
      }

      if (result.success) {
        toast.success(t('published'), { className: 'rounded-full' })
        onOpenChange(false)
        onPublished()
      } else {
        toast.error(result.error ?? t('error'), { className: 'rounded-full' })
      }
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {errors && errors.length > 0 ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="size-5" />
              <span className="text-sm font-medium">{t('validationFailed')}</span>
            </div>
            <ul className="space-y-2">
              {errors.map((error, i) => (
                <li
                  key={i}
                  className="bg-destructive/5 text-destructive flex items-start gap-2 rounded-md p-2 text-sm"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-sm">{t('readyToPublish')}</span>
            </div>
            <p className="text-muted-foreground text-sm">{t('publishDescription')}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          {(!errors || errors.length === 0) && (
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? t('publishing') : t('publishButton')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
