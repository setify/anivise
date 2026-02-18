'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GuideIcon } from './icon-picker'
import { getGuideDownloadUrl } from '../actions'
import type { GuideRow } from '../actions'

interface GuideCardProps {
  guide: GuideRow
  isAdmin: boolean
  onEdit: (guide: GuideRow) => void
  onDelete: (guide: GuideRow) => void
}

function getFileTypeBadge(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('wordprocessingml')) return 'Word'
  if (mimeType.includes('spreadsheetml')) return 'Excel'
  if (mimeType.includes('presentationml')) return 'PowerPoint'
  return 'File'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function GuideCard({ guide, isAdmin, onEdit, onDelete }: GuideCardProps) {
  const tCommon = useTranslations('common')
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    const url = await getGuideDownloadUrl(guide.id)
    if (url) {
      window.open(url, '_blank')
    }
    setDownloading(false)
  }

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleDownload}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <GuideIcon name={guide.icon} className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{guide.name}</p>
            </div>
            {guide.description && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                {guide.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {getFileTypeBadge(guide.mimeType)}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {formatFileSize(guide.fileSize)}
              </span>
            </div>
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(guide)
                  }}
                >
                  <Pencil className="mr-2 size-3.5" />
                  {tCommon('edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(guide)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  {tCommon('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
