'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  FileText,
  Upload,
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { uploadAnalysisDocument, deleteAnalysisDocument } from '../actions'
import type { DocumentRow } from '../actions'

interface DocumentsSectionProps {
  analysisId: string
  documents: DocumentRow[]
  onUploadComplete: () => void
}

const ACCEPTED_TYPES = '.pdf,.docx,.txt'
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

function getFileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('wordprocessingml')) return 'DOCX'
  if (mimeType === 'text/plain') return 'TXT'
  return 'Datei'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsSection({
  analysisId,
  documents,
  onUploadComplete,
}: DocumentsSectionProps) {
  const t = useTranslations('analyses.detail.documents')
  const [uploading, setUploading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE) {
      toast.error(t('tooLarge'))
      return
    }

    setUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
      }
      const base64 = btoa(binary)

      const result = await uploadAnalysisDocument({
        analysisId,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        base64,
      })

      if (result.success) {
        toast.success(t('uploadSuccess'))
        onUploadComplete()
      } else {
        toast.error(t('uploadError'))
      }
    } catch {
      toast.error(t('uploadError'))
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(docId: string) {
    const result = await deleteAnalysisDocument(docId)
    if (result.success) {
      toast.success(t('deleted'))
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4" />
          {t('title')}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-2 size-3.5 animate-spin" />
          ) : (
            <Plus className="mr-2 size-3.5" />
          )}
          {uploading ? t('uploading') : t('add')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <FileText className="text-muted-foreground mb-2 size-8" />
            <p className="text-muted-foreground text-sm">{t('empty')}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t('emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-md border">
                <div
                  className="flex cursor-pointer items-center gap-3 p-3"
                  onClick={() =>
                    setExpandedId(expandedId === doc.id ? null : doc.id)
                  }
                >
                  <div className="text-muted-foreground shrink-0">
                    {expandedId === doc.id ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {doc.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getFileTypeLabel(doc.mimeType)}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {doc.uploaderName} · {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(doc.id)
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                {expandedId === doc.id && (
                  <div className="border-t px-3 py-3">
                    {doc.extractedText ? (
                      <div className="max-h-60 overflow-y-auto">
                        <p className="whitespace-pre-wrap text-sm">
                          {doc.extractedText}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">
                        {t('noText')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
