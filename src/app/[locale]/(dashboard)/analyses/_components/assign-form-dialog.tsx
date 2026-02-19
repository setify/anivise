'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getAvailableFormsForAssignment,
  assignFormToAnalysis,
} from '../form-assignment-actions'
import type { AvailableForm } from '../form-assignment-actions'

interface AssignFormDialogProps {
  analysisId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned: () => void
}

export function AssignFormDialog({
  analysisId,
  open,
  onOpenChange,
  onAssigned,
}: AssignFormDialogProps) {
  const t = useTranslations('analyses.detail.forms.assignDialog')
  const tCommon = useTranslations('common')

  const [forms, setForms] = useState<AvailableForm[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      setSelectedFormId('')
      setDueDate('')
      getAvailableFormsForAssignment(analysisId).then((result) => {
        setForms(result)
        setLoading(false)
      })
    }
  }, [open, analysisId])

  async function handleAssign() {
    if (!selectedFormId) return

    setAssigning(true)
    const result = await assignFormToAnalysis(
      analysisId,
      selectedFormId,
      dueDate || undefined
    )
    setAssigning(false)

    if (result.success) {
      toast.success(t('success'))
      onOpenChange(false)
      onAssigned()
    } else {
      toast.error(t('error'))
    }
  }

  const selectedForm = forms.find((f) => f.id === selectedFormId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : forms.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground text-sm">{t('noForms')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('selectForm')}</Label>
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectFormPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedForm?.description && (
                <p className="text-muted-foreground text-xs">
                  {selectedForm.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('dueDate')}</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedFormId || assigning}
          >
            {assigning ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                {t('assigning')}
              </>
            ) : (
              t('confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
