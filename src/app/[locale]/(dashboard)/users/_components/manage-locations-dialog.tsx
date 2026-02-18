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
import { createLocation, updateLocation, deleteLocation } from '../actions'
import type { OrgLocation } from '../actions'

interface ManageLocationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: OrgLocation[]
}

export function ManageLocationsDialog({
  open,
  onOpenChange,
  locations,
}: ManageLocationsDialogProps) {
  const t = useTranslations('org.users.locations')
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const result = await createLocation(form)
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
    const result = await updateLocation(form)
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
    const result = await deleteLocation(id)
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add form */}
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-2">
              <Input
                name="name"
                required
                placeholder={t('namePlaceholder')}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={loading}>
                {t('add')}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input name="address" placeholder={t('addressPlaceholder')} />
              <Input name="city" placeholder={t('cityPlaceholder')} />
              <Input name="country" placeholder={t('countryPlaceholder')} />
            </div>
          </form>

          {/* List */}
          {locations.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">{t('empty')}</p>
          ) : (
            <div className="space-y-2">
              {locations.map((loc) =>
                editId === loc.id ? (
                  <form
                    key={loc.id}
                    onSubmit={handleUpdate}
                    className="space-y-2 rounded-md border p-3"
                  >
                    <Input name="name" required defaultValue={loc.name} />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        name="address"
                        defaultValue={loc.address ?? ''}
                        placeholder={t('addressPlaceholder')}
                      />
                      <Input
                        name="city"
                        defaultValue={loc.city ?? ''}
                        placeholder={t('cityPlaceholder')}
                      />
                      <Input
                        name="country"
                        defaultValue={loc.country ?? ''}
                        placeholder={t('countryPlaceholder')}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditId(null)}
                      >
                        &times;
                      </Button>
                      <Button type="submit" size="sm" disabled={loading}>
                        {t('save')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{loc.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {t('usedBy', { count: loc.usageCount })}
                        </Badge>
                      </div>
                      {(loc.address || loc.city || loc.country) && (
                        <p className="text-muted-foreground text-xs">
                          {[loc.address, loc.city, loc.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setEditId(loc.id)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive size-7"
                        onClick={() => handleDelete(loc.id)}
                        disabled={loading || loc.usageCount > 0}
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
