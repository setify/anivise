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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { changeEmployeeStatus } from '../actions'
import type { EmployeeItem } from '../actions'

interface ChangeStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeItem
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  archived: 'outline',
}

const allStatuses = ['active', 'inactive', 'archived'] as const

export function ChangeStatusDialog({
  open,
  onOpenChange,
  employee,
}: ChangeStatusDialogProps) {
  const t = useTranslations('org.employees.statusDialog')
  const ts = useTranslations('org.employees.status')
  const [loading, setLoading] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')

  const availableStatuses = allStatuses.filter((s) => s !== employee.status)

  async function handleSubmit() {
    if (!newStatus) return
    setLoading(true)

    const result = await changeEmployeeStatus(
      employee.id,
      newStatus as 'active' | 'inactive' | 'archived'
    )
    setLoading(false)

    if (result.success) {
      toast.success(t('changed'))
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('current')}</Label>
            <div>
              <Badge variant={statusBadgeVariant[employee.status] || 'outline'}>
                {ts(employee.status)}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('new')}</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ts(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={loading || !newStatus}
          >
            {loading ? t('changing') : t('confirmButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
