'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createDepartment, updateDepartment, deleteDepartment } from '../actions'
import type { OrgDepartment } from '../actions'

interface ManageDepartmentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: OrgDepartment[]
}

export function ManageDepartmentsDialog({
  open,
  onOpenChange,
  departments,
}: ManageDepartmentsDialogProps) {
  const t = useTranslations('org.users.departments')
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const result = await createDepartment(form)
    setLoading(false)
    if (result.success) {
      toast.success(t('created'))
      e.currentTarget.reset()
    } else {
      toast.error(t('error'))
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editId) return
    setLoading(true)
    const form = new FormData(e.currentTarget)
    form.set('id', editId)
    const result = await updateDepartment(form)
    setLoading(false)
    if (result.success) {
      toast.success(t('updated'))
      setEditId(null)
    } else {
      toast.error(t('error'))
    }
  }

  async function handleDelete(id: string) {
    setLoading(true)
    const result = await deleteDepartment(id)
    setLoading(false)
    if (result.success) {
      toast.success(t('deleted'))
    } else if (result.error === 'in_use') {
      toast.error(t('inUse'))
    } else {
      toast.error(t('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add form */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              name="name"
              required
              placeholder={t('namePlaceholder')}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={loading}>
              {t('add')}
            </Button>
          </form>

          {/* List */}
          {departments.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">{t('empty')}</p>
          ) : (
            <div className="space-y-2">
              {departments.map((dept) =>
                editId === dept.id ? (
                  <form
                    key={dept.id}
                    onSubmit={handleUpdate}
                    className="flex gap-2"
                  >
                    <Input
                      name="name"
                      required
                      defaultValue={dept.name}
                      className="flex-1"
                    />
                    <Input
                      name="description"
                      defaultValue={dept.description ?? ''}
                      placeholder={t('descriptionPlaceholder')}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={loading}>
                      {t('save')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditId(null)}
                    >
                      &times;
                    </Button>
                  </form>
                ) : (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dept.name}</span>
                      {dept.description && (
                        <span className="text-muted-foreground text-xs">
                          {dept.description}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {t('usedBy', { count: dept.usageCount })}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setEditId(dept.id)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive size-7"
                        onClick={() => handleDelete(dept.id)}
                        disabled={loading || dept.usageCount > 0}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
