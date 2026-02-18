'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pencil, Trash2, MoreHorizontal, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GuideIcon } from './icon-picker'
import { getFileTypeBadge, formatFileSize } from './guide-utils'
import { getGuideDownloadUrl } from '../actions'
import type { GuideRow } from '../actions'

interface GuideTableProps {
  guides: GuideRow[]
  isAdmin: boolean
  onEdit: (guide: GuideRow) => void
  onDelete: (guide: GuideRow) => void
}

export function GuideTable({ guides, isAdmin, onEdit, onDelete }: GuideTableProps) {
  const t = useTranslations('org.guides')
  const tCommon = useTranslations('common')

  return (
    <Card>
      <CardContent className="p-0">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">{tCommon('name')}</TableHead>
              <TableHead className="w-[15%]">{t('table.category')}</TableHead>
              <TableHead className="w-[10%]">{t('table.type')}</TableHead>
              <TableHead className="w-[10%]">{t('table.size')}</TableHead>
              {isAdmin && (
                <TableHead className="w-[15%]">{t('table.access')}</TableHead>
              )}
              <TableHead className="w-[10%]" />
            </TableRow>
          </TableHeader>
        <TableBody>
          {guides.map((guide) => (
            <GuideTableRow
              key={guide.id}
              guide={guide}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              uncategorizedLabel={t('uncategorized')}
              tCommon={tCommon}
              tGuides={t}
            />
          ))}
        </TableBody>
      </Table>
      </CardContent>
    </Card>
  )
}

function GuideTableRow({
  guide,
  isAdmin,
  onEdit,
  onDelete,
  uncategorizedLabel,
  tCommon,
  tGuides,
}: {
  guide: GuideRow
  isAdmin: boolean
  onEdit: (guide: GuideRow) => void
  onDelete: (guide: GuideRow) => void
  uncategorizedLabel: string
  tCommon: ReturnType<typeof useTranslations>
  tGuides: ReturnType<typeof useTranslations>
}) {
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
    <TableRow className="group cursor-pointer" onClick={handleDownload}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
            <GuideIcon name={guide.icon} className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">{guide.name}</p>
            {guide.description && (
              <p className="text-muted-foreground text-xs line-clamp-2">
                {guide.description}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {guide.categoryName ?? uncategorizedLabel}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {getFileTypeBadge(guide.mimeType)}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {formatFileSize(guide.fileSize)}
        </span>
      </TableCell>
      {isAdmin && (
        <TableCell>
          <div className="flex gap-1">
            {guide.accessManagers && (
              <Badge variant="outline" className="text-xs">
                {tGuides('table.managers')}
              </Badge>
            )}
            {guide.accessEmployees && (
              <Badge variant="outline" className="text-xs">
                {tGuides('table.employees')}
              </Badge>
            )}
          </div>
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              handleDownload()
            }}
          >
            <Download className="size-3.5" />
          </Button>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 group-hover:opacity-100"
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
      </TableCell>
    </TableRow>
  )
}
