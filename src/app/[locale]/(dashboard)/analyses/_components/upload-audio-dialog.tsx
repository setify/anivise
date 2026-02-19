'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Upload, FileAudio, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { uploadAudioFile } from '../actions'

const ACCEPTED_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
  'audio/ogg',
]
const ACCEPTED_EXTENSIONS = '.mp3,.wav,.m4a,.webm,.ogg'
const MAX_SIZE = 200 * 1024 * 1024 // 200 MB

interface UploadAudioDialogProps {
  analysisId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: () => void
}

export function UploadAudioDialog({
  analysisId,
  open,
  onOpenChange,
  onUploadComplete,
}: UploadAudioDialogProps) {
  const t = useTranslations('analyses.detail.recording')
  const tCommon = useTranslations('common')
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('de')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleReset() {
    setFile(null)
    setUploading(false)
    setProgress('')
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleUpload() {
    if (!file) return

    if (file.size > MAX_SIZE) {
      toast.error(t('uploadTooLarge'))
      return
    }

    setUploading(true)
    setProgress(t('uploadProgress.uploading'))

    try {
      // Convert file to base64 for server action
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      // Process in chunks to avoid call stack overflow
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
      }
      const base64 = btoa(binary)

      setProgress(t('uploadProgress.transcribing'))

      const result = await uploadAudioFile({
        analysisId,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        language,
        base64,
      })

      if (result.success) {
        toast.success(t('uploadSuccess'))
        handleReset()
        onOpenChange(false)
        onUploadComplete()
      } else {
        toast.error(result.error ?? t('uploadError'))
      }
    } catch {
      toast.error(t('uploadError'))
    } finally {
      setUploading(false)
      setProgress('')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!uploading) {
          onOpenChange(o)
          if (!o) handleReset()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            {t('uploadTitle')}
          </DialogTitle>
          <DialogDescription>{t('uploadDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('language')}</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File drop zone */}
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="border-border hover:border-primary/50 hover:bg-accent/50 flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors"
          >
            {file ? (
              <>
                <FileAudio className="text-primary size-8" />
                <div className="text-center">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="text-muted-foreground size-8" />
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    {t('uploadDropzone')}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    MP3, WAV, M4A, WebM, OGG (max. 200 MB)
                  </p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          {/* Progress */}
          {uploading && progress && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>{progress}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {progress}
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                {t('uploadButton')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
