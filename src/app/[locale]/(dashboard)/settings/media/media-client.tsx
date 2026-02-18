'use client'

import { useState, useCallback, useRef, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
  Upload, Trash2, Grid3x3, List, Search,
  Copy, Check, FileText, Eye, MoreHorizontal, ImageOff, FileImage,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatFileSize, isImage, getExtension } from '@/lib/media/file-utils'
import { PlanUsageBar } from '@/components/org/plan-usage-bar'
import type { MediaFile, MediaContext } from '@/types/database'
import { listOrgMedia, uploadOrgMedia, deleteOrgMedia, getOrgMediaPublicUrl } from './actions'
import type { OrganizationLimits } from '@/lib/products/limits'

const CONTEXTS: Array<{ value: MediaContext; label: string }> = [
  { value: 'org_logo', label: 'Logo' },
  { value: 'form_header', label: 'Formular-Header' },
  { value: 'report_asset', label: 'Analyse' },
  { value: 'general', label: 'Sonstiges' },
]

interface Props {
  initialFiles: MediaFile[]
  storageLimitMb: number | null
  usedStorageMb: number
}

export function OrgMediaClient({ initialFiles, storageLimitMb, usedStorageMb }: Props) {
  const t = useTranslations('org.settings.media')
  const [files, setFiles] = useState<MediaFile[]>(initialFiles)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [contextFilter, setContextFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null)
  const [deleteUsage, setDeleteUsage] = useState<string[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Filter ───

  const filteredFiles = files.filter((f) => {
    if (contextFilter !== 'all' && f.context !== contextFilter) return false
    if (search && !f.filename.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ─── Refresh ───

  const refreshFiles = useCallback(() => {
    startTransition(async () => {
      const result = await listOrgMedia(
        contextFilter !== 'all' ? { context: contextFilter as MediaContext } : undefined
      )
      if (result.success && result.data) setFiles(result.data)
    })
  }, [contextFilter])

  // ─── Upload ───

  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)

    for (const file of Array.from(fileList)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('context', 'general')

      const result = await uploadOrgMedia(fd)
      if (result.storageLimitReached) {
        toast.error(t('storageLimitReached'))
        break
      } else if (result.success && result.data) {
        toast.success(t('uploaded'))
        setFiles((prev) => [result.data!, ...prev])
      } else {
        toast.error(result.error ?? t('uploadError'))
      }
    }

    setUploading(false)
    setShowUpload(false)
  }, [t])

  // ─── Delete ───

  const handleDelete = useCallback(async (force?: boolean) => {
    if (!deleteTarget) return
    const result = await deleteOrgMedia(deleteTarget.id, force)
    if (result.success) {
      toast.success(t('deleted'))
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id))
      setDeleteTarget(null)
      setDeleteUsage([])
    } else if (result.inUse && result.usedIn) {
      setDeleteUsage(result.usedIn)
    } else {
      toast.error(result.error ?? t('deleteError'))
    }
  }, [deleteTarget, t])

  // ─── Copy URL ───

  const handleCopyUrl = useCallback(async (file: MediaFile) => {
    const result = await getOrgMediaPublicUrl(file.id)
    if (result.success && result.url) {
      await navigator.clipboard.writeText(result.url)
      setCopiedId(file.id)
      toast.success(t('urlCopied'))
      setTimeout(() => setCopiedId(null), 2000)
    }
  }, [t])

  // ─── Selection ───

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === filteredFiles.length
        ? new Set()
        : new Set(filteredFiles.map((f) => f.id))
    )
  }

  // ─── Stats ───
  const totalFiles = files.length
  const imageCount = files.filter((f) => isImage(f.mimeType)).length
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Upload className="mr-1.5 size-3.5" />
          {t('upload')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('totalFiles'), value: totalFiles },
          { label: t('images'), value: imageCount },
          { label: t('totalSize'), value: formatFileSize(totalBytes) },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-muted-foreground text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={contextFilter} onValueChange={setContextFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('allContexts')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allContexts')}</SelectItem>
            {CONTEXTS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border rounded-md p-0.5">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="size-8" onClick={() => setView('grid')}>
            <Grid3x3 className="size-4" />
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="size-8" onClick={() => setView('list')}>
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <ImageOff className="text-muted-foreground mb-3 size-10" />
          <p className="text-muted-foreground font-medium">
            {search || contextFilter !== 'all' ? t('noSearchResults') : t('noFiles')}
          </p>
          {!search && contextFilter === 'all' && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowUpload(true)}>
              <Upload className="mr-1.5 size-3.5" />
              {t('uploadFirst')}
            </Button>
          )}
        </div>
      ) : view === 'grid' ? (
        <MediaGrid
          files={filteredFiles}
          selectedIds={selectedIds}
          copiedId={copiedId}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onPreview={setPreviewFile}
          onDelete={setDeleteTarget}
          onCopyUrl={handleCopyUrl}
          contextLabels={Object.fromEntries(CONTEXTS.map((c) => [c.value, c.label]))}
        />
      ) : (
        <MediaListView
          files={filteredFiles}
          selectedIds={selectedIds}
          copiedId={copiedId}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onPreview={setPreviewFile}
          onDelete={setDeleteTarget}
          onCopyUrl={handleCopyUrl}
          contextLabels={Object.fromEntries(CONTEXTS.map((c) => [c.value, c.label]))}
          t={t}
        />
      )}

      {/* Storage usage */}
      <div className="rounded-lg border p-4">
        <PlanUsageBar
          label={t('storageUsage')}
          current={usedStorageMb}
          limit={storageLimitMb}
          formatValue={(v) => v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v} MB`}
          unit={t('unitUsed')}
        />
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('uploadFile')}</DialogTitle>
            <DialogDescription>{t('uploadHint')}</DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="text-muted-foreground mb-3 size-8" />
            <p className="text-muted-foreground text-sm">{t('dropOrClick')}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t('maxFileSize')}</p>
            {uploading && <p className="text-primary mt-2 text-sm font-medium">{t('uploading')}</p>}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,.docx,.xlsx"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile && isImage(previewFile.mimeType) ? <FileImage className="size-4" /> : <FileText className="size-4" />}
              {previewFile?.filename}
            </DialogTitle>
            <DialogDescription>
              {previewFile && formatFileSize(previewFile.size)} · {previewFile && getExtension(previewFile.filename)}
            </DialogDescription>
          </DialogHeader>
          {previewFile && isImage(previewFile.mimeType) && (
            <div className="flex items-center justify-center rounded-lg bg-muted/50 p-4">
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${previewFile.bucket}/${previewFile.path}`}
                alt={previewFile.filename}
                className="max-h-[400px] rounded object-contain"
              />
            </div>
          )}
          {previewFile && !isImage(previewFile.mimeType) && (
            <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-8">
              <FileText className="text-muted-foreground mb-2 size-12" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => previewFile && handleCopyUrl(previewFile)}>
              {copiedId === previewFile?.id ? <Check className="mr-1.5 size-3.5" /> : <Copy className="mr-1.5 size-3.5" />}
              {t('copyUrl')}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => { if (previewFile) { setDeleteTarget(previewFile); setPreviewFile(null) } }}>
              <Trash2 className="mr-1.5 size-3.5" />{t('deleteFile')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => { setDeleteTarget(null); setDeleteUsage([]) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget && t('deleteConfirm', { name: deleteTarget.filename })}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          {deleteUsage.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-destructive text-sm font-medium">{t('inUseWarning')}</p>
              <ul className="text-destructive mt-1 list-disc pl-5 text-sm">
                {deleteUsage.map((u) => <li key={u}>{u}</li>)}
              </ul>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleDelete(deleteUsage.length > 0)}
            >
              {deleteUsage.length > 0 ? t('forceDelete') : t('deleteFile')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Grid View ───────────────────────────────────────────────────────────────

interface ViewProps {
  files: MediaFile[]
  selectedIds: Set<string>
  copiedId: string | null
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onPreview: (file: MediaFile) => void
  onDelete: (file: MediaFile) => void
  onCopyUrl: (file: MediaFile) => void
  contextLabels: Record<string, string>
  t?: ReturnType<typeof useTranslations>
}

function MediaGrid({ files, selectedIds, copiedId, onToggleSelect, onToggleSelectAll, onPreview, onDelete, onCopyUrl, contextLabels }: ViewProps) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Checkbox checked={selectedIds.size === files.length && files.length > 0} onCheckedChange={onToggleSelectAll} />
        <span className="text-muted-foreground text-xs">{selectedIds.size > 0 ? `${selectedIds.size} ausgewählt` : 'Alle auswählen'}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {files.map((file) => (
          <div key={file.id} className={cn('group relative rounded-lg border bg-card transition-all hover:shadow-md', selectedIds.has(file.id) && 'ring-primary ring-2')}>
            <div className="absolute left-2 top-2 z-10">
              <Checkbox checked={selectedIds.has(file.id)} onCheckedChange={() => onToggleSelect(file.id)} className="bg-background/80 backdrop-blur-sm" />
            </div>
            <button className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-t-lg bg-muted/50" onClick={() => onPreview(file)}>
              {isImage(file.mimeType) ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.bucket}/${file.path}`}
                  alt={file.filename}
                  className="size-full object-cover"
                />
              ) : (
                <FileText className="text-muted-foreground size-10" />
              )}
            </button>
            <div className="p-2">
              <p className="truncate text-xs font-medium" title={file.filename}>{file.filename}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-muted-foreground text-[10px]">{formatFileSize(file.size)}</span>
                <Badge variant="outline" className="h-4 px-1 text-[9px]">{contextLabels[file.context] ?? file.context}</Badge>
              </div>
            </div>
            <div className="absolute right-1.5 top-1.5 z-10 opacity-0 transition-opacity group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="size-7 bg-background/80 backdrop-blur-sm">
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPreview(file)}><Eye className="mr-2 size-4" />Vorschau</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCopyUrl(file)}>
                    {copiedId === file.id ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}URL kopieren
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(file)}><Trash2 className="mr-2 size-4" />Löschen</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────

function MediaListView({ files, selectedIds, copiedId, onToggleSelect, onToggleSelectAll, onPreview, onDelete, onCopyUrl, contextLabels, t }: ViewProps & { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="w-10 p-3"><Checkbox checked={selectedIds.size === files.length && files.length > 0} onCheckedChange={onToggleSelectAll} /></th>
            <th className="p-3 text-left font-medium">Dateiname</th>
            <th className="p-3 text-left font-medium">Größe</th>
            <th className="p-3 text-left font-medium">Kontext</th>
            <th className="p-3 text-left font-medium">Hochgeladen</th>
            <th className="w-10 p-3" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className={cn('border-b transition-colors last:border-0 hover:bg-muted/30', selectedIds.has(file.id) && 'bg-primary/5')}>
              <td className="p-3"><Checkbox checked={selectedIds.has(file.id)} onCheckedChange={() => onToggleSelect(file.id)} /></td>
              <td className="p-3">
                <button className="flex items-center gap-2.5 text-left hover:underline" onClick={() => onPreview(file)}>
                  <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-muted/50">
                    {isImage(file.mimeType) ? (
                      <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.bucket}/${file.path}`} alt={file.filename} className="size-full object-cover" />
                    ) : (
                      <FileText className="text-muted-foreground size-4" />
                    )}
                  </div>
                  <span className="truncate max-w-[280px] font-medium">{file.filename}</span>
                </button>
              </td>
              <td className="text-muted-foreground p-3">{formatFileSize(file.size)}</td>
              <td className="p-3"><Badge variant="outline" className="text-xs">{contextLabels[file.context] ?? file.context}</Badge></td>
              <td className="text-muted-foreground p-3">{new Date(file.createdAt).toLocaleDateString('de-DE')}</td>
              <td className="p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7"><MoreHorizontal className="size-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPreview(file)}><Eye className="mr-2 size-4" />Vorschau</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopyUrl(file)}>
                      {copiedId === file.id ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}URL kopieren
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(file)}><Trash2 className="mr-2 size-4" />Löschen</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
