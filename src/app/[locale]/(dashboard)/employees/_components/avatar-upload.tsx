'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Upload, X, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import { OrgMediaPicker } from '../../settings/branding/org-media-picker'

interface AvatarUploadProps {
  currentUrl: string | null
  name: string
  onFileSelect: (file: File | null) => void
  onUrlSelect: (url: string) => void
  onRemove: () => void
  removed: boolean
  fileSelected: File | null
  selectedUrl: string | null
}

export function AvatarUpload({
  currentUrl,
  name,
  onFileSelect,
  onUrlSelect,
  onRemove,
  removed,
  fileSelected,
  selectedUrl,
}: AvatarUploadProps) {
  const t = useTranslations('org.employees.addDialog')
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)

  const maxBytes = 2 * 1024 * 1024

  const previewSrc = fileSelected
    ? URL.createObjectURL(fileSelected)
    : selectedUrl
      ? selectedUrl
      : !removed
        ? currentUrl
        : null

  function handleFile(file: File) {
    if (file.size > maxBytes) {
      toast.error(t('avatarTooLarge'))
      return
    }
    onFileSelect(file)
  }

  return (
    <div className="space-y-2">
      <Label>{t('avatar')}</Label>
      <div className="flex items-center gap-4">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt="Avatar"
            className="size-16 rounded-full border object-cover"
          />
        ) : (
          <AvatarDisplay name={name} size="lg" />
        )}

        <div className="flex flex-col gap-2">
          <div
            className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-4 py-2 text-sm transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
          >
            <Upload className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-xs">{t('avatarUpload')}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMediaOpen(true)}
            >
              <Images className="mr-1.5 size-3.5" />
              {t('avatarFromLibrary')}
            </Button>
            {previewSrc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <X className="mr-1.5 size-3.5" />
                {t('avatarRemove')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <OrgMediaPicker
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelect={(url) => {
          onUrlSelect(url)
          setMediaOpen(false)
        }}
      />
    </div>
  )
}
