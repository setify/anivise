'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
import { IconPicker } from './icon-picker'
import { createGuide, updateGuide } from '../actions'
import type { GuideRow, GuideCategoryRow } from '../actions'

interface GuideFormDialogProps {
  guide?: GuideRow | null
  categories: GuideCategoryRow[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ERROR_KEYS: Record<string, string> = {
  no_file: 'noFile',
  invalid_file_type: 'invalidFileType',
  file_too_large: 'fileTooLarge',
  upload_failed: 'uploadFailed',
}

export function GuideFormDialog({
  guide,
  categories,
  open,
  onOpenChange,
}: GuideFormDialogProps) {
  const t = useTranslations('org.guides.form')
  const tCommon = useTranslations('common')
  const isEdit = !!guide
  const [loading, setLoading] = useState(false)
  const [icon, setIcon] = useState(guide?.icon ?? 'File')
  const [categoryId, setCategoryId] = useState(guide?.categoryId ?? '')
  const [accessManagers, setAccessManagers] = useState(guide?.accessManagers ?? true)
  const [accessEmployees, setAccessEmployees] = useState(guide?.accessEmployees ?? false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleReset() {
    setIcon(guide?.icon ?? 'File')
    setCategoryId(guide?.categoryId ?? '')
    setAccessManagers(guide?.accessManagers ?? true)
    setAccessEmployees(guide?.accessEmployees ?? false)
    setSelectedFile(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData()

    formData.set('name', (form.elements.namedItem('name') as HTMLInputElement).value)
    formData.set('description', (form.elements.namedItem('description') as HTMLTextAreaElement).value)
    formData.set('icon', icon)
    formData.set('categoryId', categoryId)
    formData.set('accessManagers', String(accessManagers))
    formData.set('accessEmployees', String(accessEmployees))

    if (selectedFile) {
      formData.set('file', selectedFile)
    }

    let result: { success: boolean; error?: string }

    if (isEdit) {
      formData.set('id', guide!.id)
      result = await updateGuide(formData)
    } else {
      if (!selectedFile) {
        toast.error(t('noFile'))
        setLoading(false)
        return
      }
      formData.set('file', selectedFile)
      result = await createGuide(formData)
    }

    setLoading(false)

    if (result.success) {
      toast.success(t('success'))
      onOpenChange(false)
      handleReset()
    } else {
      const errorKey = ERROR_KEYS[result.error ?? ''] ?? 'error'
      toast.error(t(errorKey))
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) handleReset()
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editTitle') : t('addTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>{t('name')}</Label>
            <Input
              name="name"
              required
              defaultValue={guide?.name ?? ''}
              placeholder={t('namePlaceholder')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('description')}</Label>
            <Textarea
              name="description"
              defaultValue={guide?.description ?? ''}
              placeholder={t('descriptionPlaceholder')}
              rows={2}
            />
          </div>

          {/* Category + Icon row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('category')}</Label>
              <Select value={categoryId || '__none__'} onValueChange={(v) => setCategoryId(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('categoryNone')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('categoryNone')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <Label>{t('icon')}</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>{isEdit ? t('fileReplace') : t('file')}</Label>
            {isEdit && guide && !selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t('currentFile')}:</span>
                <Badge variant="outline">{guide.filename}</Badge>
                <span>({formatFileSize(guide.fileSize)})</span>
              </div>
            )}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-border hover:border-primary/50 hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-4 py-3 transition-colors"
            >
              <Upload className="text-muted-foreground size-5 shrink-0" />
              <div className="min-w-0 flex-1 text-sm">
                {selectedFile ? (
                  <span className="font-medium">{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
                ) : (
                  <span className="text-muted-foreground">{t('filePlaceholder')}</span>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Access checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="accessManagers"
                checked={accessManagers}
                onCheckedChange={(checked) => setAccessManagers(checked === true)}
              />
              <Label htmlFor="accessManagers" className="font-normal">
                {t('accessManagers')}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="accessEmployees"
                checked={accessEmployees}
                onCheckedChange={(checked) => setAccessEmployees(checked === true)}
              />
              <Label htmlFor="accessEmployees" className="font-normal">
                {t('accessEmployees')}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEdit ? t('saving') : t('adding')
                : isEdit ? t('save') : t('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
