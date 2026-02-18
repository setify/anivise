'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, ImageOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isImage, formatFileSize } from '@/lib/media/file-utils'
import type { MediaFile } from '@/types/database'
import { listOrgMedia, getOrgMediaPublicUrl } from '../media/actions'

interface OrgMediaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
}

export function OrgMediaPicker({ open, onOpenChange, onSelect }: OrgMediaPickerProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelectedId(null)
    setSearch('')
    listOrgMedia().then((r) => {
      if (r.success && r.data) {
        setFiles(r.data.filter((f) => isImage(f.mimeType)))
      }
      setLoading(false)
    })
  }, [open])

  const filtered = files.filter((f) =>
    search ? f.filename.toLowerCase().includes(search.toLowerCase()) : true
  )

  async function handleSelect(file: MediaFile) {
    setSelecting(true)
    setSelectedId(file.id)
    const r = await getOrgMediaPublicUrl(file.id)
    if (r.success && r.url) {
      onSelect(r.url)
      onOpenChange(false)
    }
    setSelecting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bild aus Mediathek wählen</DialogTitle>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[420px] overflow-y-auto mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ImageOff className="text-muted-foreground mb-3 size-10" />
              <p className="text-muted-foreground text-sm font-medium">
                {search ? 'Keine Ergebnisse' : 'Keine Bilder in der Mediathek'}
              </p>
              {!search && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Laden Sie Bilder in Einstellungen › Mediathek hoch.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {filtered.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  disabled={selecting}
                  onClick={() => handleSelect(file)}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md',
                    selectedId === file.id && 'ring-primary ring-2'
                  )}
                >
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-muted/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.bucket}/${file.path}`}
                      alt={file.filename}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="p-1.5">
                    <p className="truncate text-xs font-medium" title={file.filename}>
                      {file.filename}
                    </p>
                    <p className="text-muted-foreground text-[10px]">{formatFileSize(file.size)}</p>
                  </div>
                  {selectedId === file.id && selecting && (
                    <div className="bg-primary/80 absolute inset-0 flex items-center justify-center">
                      <Loader2 className="size-5 animate-spin text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
