'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createAnalysis } from '../actions'
import type { ActiveEmployee, OrgManager } from '../actions'

interface CreateAnalysisDialogProps {
  employees: ActiveEmployee[]
  managers: OrgManager[]
  isAdmin: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAnalysisDialog({
  employees,
  managers,
  isAdmin,
  open,
  onOpenChange,
}: CreateAnalysisDialogProps) {
  const t = useTranslations('analyses.create')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [managerId, setManagerId] = useState(
    managers.find((m) => m.isCurrentUser)?.userId ?? ''
  )

  function handleReset() {
    setEmployeeId('')
    setManagerId(managers.find((m) => m.isCurrentUser)?.userId ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId) return
    setLoading(true)

    const formData = new FormData()
    formData.set('employeeId', employeeId)
    if (isAdmin && managerId) formData.set('managerId', managerId)

    const result = await createAnalysis(formData)
    setLoading(false)

    if (result.success && result.analysisId) {
      toast.success(t('success'))
      onOpenChange(false)
      handleReset()
      router.push(`/${locale}/analyses/${result.analysisId}`)
    } else {
      toast.error(t('error'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) handleReset()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee selection */}
          <div className="space-y-2">
            <Label>{t('employee')}</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder={t('employeePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                    {emp.position && (
                      <span className="text-muted-foreground"> - {emp.position}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manager selection (org_admin only) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>{t('manager')}</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('managerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name}
                      {m.isCurrentUser && ' (Sie)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !employeeId}>
              {loading ? t('creating') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
