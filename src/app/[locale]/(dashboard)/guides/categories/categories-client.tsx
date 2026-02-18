'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  createGuideCategory,
  updateGuideCategory,
  deleteGuideCategory,
} from '../actions'
import type { GuideCategoryRow } from '../actions'

interface CategoriesClientProps {
  categories: GuideCategoryRow[]
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const t = useTranslations('org.guides.categories')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCat, setEditCat] = useState<GuideCategoryRow | null>(null)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    if (editCat) {
      form.set('id', editCat.id)
      const result = await updateGuideCategory(form)
      if (result.success) {
        toast.success(t('updated'))
        setDialogOpen(false)
        setEditCat(null)
      } else {
        toast.error(t('error'))
      }
    } else {
      const result = await createGuideCategory(form)
      if (result.success) {
        toast.success(t('created'))
        setDialogOpen(false)
      } else {
        toast.error(t('error'))
      }
    }
    setLoading(false)
  }

  async function handleDelete(cat: GuideCategoryRow) {
    setLoading(true)
    const result = await deleteGuideCategory(cat.id)
    setLoading(false)
    if (result.success) {
      toast.success(t('deleted'))
    } else {
      toast.error(t('error'))
    }
  }

  function openAdd() {
    setEditCat(null)
    setDialogOpen(true)
  }

  function openEdit(cat: GuideCategoryRow) {
    setEditCat(cat)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
          <p className="text-muted-foreground">{t('pageDescription')}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 size-4" />
          {t('addButton')}
        </Button>
      </div>

      {/* List */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{cat.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {t('guideCount', { count: cat.guideCount })}
                    </Badge>
                  </div>
                  {cat.description && (
                    <p className="text-muted-foreground text-sm">{cat.description}</p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(cat)}>
                      <Pencil className="mr-2 size-3.5" />
                      {tCommon('edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(cat)}
                      disabled={loading}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 size-3.5" />
                      {t('delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Warn about deleting categories with guides */}
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditCat(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editCat ? t('editTitle') : t('addTitle')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('name')}</Label>
              <Input
                name="name"
                required
                defaultValue={editCat?.name ?? ''}
                placeholder={t('namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('description')}</Label>
              <Input
                name="description"
                defaultValue={editCat?.description ?? ''}
                placeholder={t('descriptionPlaceholder')}
              />
            </div>
            {editCat && editCat.guideCount > 0 && (
              <p className="text-muted-foreground text-sm">
                {t('hasGuides')}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? editCat
                    ? t('saving')
                    : t('adding')
                  : editCat
                    ? t('save')
                    : t('add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
