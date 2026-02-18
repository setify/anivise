'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Upload, Loader2, ImageOff, FileText, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { isImage, formatFileSize } from '@/lib/media/file-utils'
import type { MediaFile, MediaContext } from '@/types/database'
import {
  listMedia,
  uploadMedia,
  getMediaPublicUrl,
} from '@/app/[locale]/(superadmin)/admin/media/actions'

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
  imagesOnly?: boolean
  context?: MediaContext
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  imagesOnly = true,
  context,
}: MediaPickerDialogProps) {
  const t = useTranslations('mediaPicker')
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch files when dialog opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelectedId(null)
    setSearch('')
    listMedia(context ? { context } : undefined).then((result) => {
      if (result.success && result.data) {
        const data = imagesOnly
          ? result.data.filter((f) => isImage(f.mimeType))
          : result.data
        setFiles(data)
      }
      setLoading(false)
    })
  }, [open, context, imagesOnly])

  const filteredFiles = files.filter((f) =>
    search ? f.filename.toLowerCase().includes(search.toLowerCase()) : true
  )

  const handleSelect = useCallback(
    async (fileId: string) => {
      setSelecting(true)
      setSelectedId(fileId)
      const result = await getMediaPublicUrl(fileId)
      if (result.success && result.url) {
        onSelect(result.url)
        onOpenChange(false)
      }
      setSelecting(false)
    },
    [onSelect, onOpenChange]
  )

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('context', 'general')

      const result = await uploadMedia(formData)
      if (result.success && result.data) {
        const urlResult = await getMediaPublicUrl(result.data.id)
        if (urlResult.success && urlResult.url) {
          onSelect(urlResult.url)
          onOpenChange(false)
        }
      }
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [onSelect, onOpenChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="browse" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="browse" className="flex-1">
              <Search className="mr-1.5 size-3.5" />
              {t('browse')}
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">
              <Upload className="mr-1.5 size-3.5" />
              {t('upload')}
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="text-muted-foreground size-6 animate-spin" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ImageOff className="text-muted-foreground mb-3 size-10" />
                  <p className="text-muted-foreground font-medium">
                    {search ? t('noSearchResults') : t('noFiles')}
                  </p>
                  {!search && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {t('noFilesHint')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {filteredFiles.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      disabled={selecting}
                      onClick={() => handleSelect(file.id)}
                      className={cn(
                        'group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md',
                        selectedId === file.id && 'ring-primary ring-2'
                      )}
                    >
                      <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-muted/50">
                        {isImage(file.mimeType) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.bucket}/${file.path}`}
                            alt={file.altText ?? file.filename}
                            className="size-full object-cover"
                          />
                        ) : (
                          <FileText className="text-muted-foreground size-8" />
                        )}
                      </div>
                      <div className="p-1.5">
                        <p
                          className="truncate text-xs font-medium"
                          title={file.filename}
                        >
                          {file.filename}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      {/* Selection indicator */}
                      {selectedId === file.id && selecting && (
                        <div className="bg-primary/80 absolute inset-0 flex items-center justify-center">
                          <Loader2 className="size-5 animate-spin text-white" />
                        </div>
                      )}
                      {selectedId === file.id && !selecting && (
                        <div className="bg-primary absolute right-1 top-1 flex size-5 items-center justify-center rounded-full">
                          <Check className="size-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-4">
            <div
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                uploading && 'pointer-events-none opacity-60'
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="text-muted-foreground mb-3 size-8 animate-spin" />
                  <p className="text-muted-foreground text-sm font-medium">
                    {t('uploading')}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="text-muted-foreground mb-3 size-8" />
                  <p className="text-muted-foreground text-sm">
                    {t('uploadHint')}
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
