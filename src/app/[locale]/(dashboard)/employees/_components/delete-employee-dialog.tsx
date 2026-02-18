'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteEmployee } from '../actions'
import type { EmployeeItem } from '../actions'

interface DeleteEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeItem
}

export function DeleteEmployeeDialog({
  open,
  onOpenChange,
  employee,
}: DeleteEmployeeDialogProps) {
  const t = useTranslations('org.employees.deleteDialog')
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteEmployee(employee.id)
    setLoading(false)

    if (result.success) {
      toast.success(t('deleted'))
      onOpenChange(false)
    } else {
      toast.error(t('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">
          {t('message', { name: employee.fullName })}
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancelButton')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? t('deleting') : t('confirmButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
