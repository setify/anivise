'use client'

import { useState, useCallback, useRef, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Upload,
  Trash2,
  Grid3x3,
  List,
  Search,
  RefreshCw,
  Copy,
  Check,
  FileImage,
  FileText,
  Eye,
  MoreHorizontal,
  ImageOff,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Building2,
  Files,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatFileSize, isImage, getExtension } from '@/lib/media/file-utils'
import type { MediaFile, MediaContext } from '@/types/database'
import {
  listMedia,
  uploadMedia,
  deleteMedia,
  bulkDeleteMedia,
  syncMedia,
  getMediaPublicUrl,
  getStorageStats,
} from './actions'

const CONTEXTS: MediaContext[] = [
  'email_logo',
  'email_template',
  'form_header',
  'org_logo',
  'report_asset',
  'general',
]

interface StorageStats {
  totalSize: number
  fileCount: number
  byContext: { context: string; size: number; count: number }[]
  byOrganization: {
    orgId: string
    orgName: string
    size: number
    count: number
    quotaMb: number | null
  }[]
}

interface MediaPageClientProps {
  initialFiles: MediaFile[]
}

export function MediaPageClient({ initialFiles }: MediaPageClientProps) {
  const t = useTranslations('admin.media')
  const [files, setFiles] = useState<MediaFile[]>(initialFiles)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [contextFilter, setContextFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null)
  const [deleteUsage, setDeleteUsage] = useState<string[]>([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [syncing, setSyncing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)

  // Storage overview state
  const [showStorageOverview, setShowStorageOverview] = useState(false)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Lazy load storage stats when overview is opened
  useEffect(() => {
    if (showStorageOverview && !storageStats && !loadingStats) {
      setLoadingStats(true)
      getStorageStats().then((result) => {
        if (result.success && result.data) {
          setStorageStats(result.data)
        }
        setLoadingStats(false)
      })
    }
  }, [showStorageOverview, storageStats, loadingStats])

  // ─── Filtering ───

  const filteredFiles = files.filter((f) => {
    if (contextFilter !== 'all' && f.context !== contextFilter) return false
    if (search && !f.filename.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ─── Refresh ───

  const refreshFiles = useCallback(() => {
    startTransition(async () => {
      const result = await listMedia(
        contextFilter !== 'all' ? { context: contextFilter as MediaContext } : undefined
      )
      if (result.success && result.data) {
        setFiles(result.data)
      }
    })
  }, [contextFilter])

  // ─── Upload ───

  const handleUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      setUploading(true)

      for (const file of Array.from(fileList)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('context', 'general')

        const result = await uploadMedia(formData)
        if (result.success && result.data) {
          toast.success(t('uploaded'))
          setFiles((prev) => [result.data!, ...prev])
        } else {
          toast.error(result.error ?? t('uploadError'))
        }
      }

      setUploading(false)
      setShowUpload(false)
    },
    [t]
  )

  // ─── Delete ───

  const handleDelete = useCallback(
    async (force?: boolean) => {
      if (!deleteTarget) return

      const result = await deleteMedia(deleteTarget.id, force)
      if (result.success) {
        toast.success(t('deleted'))
        setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(deleteTarget.id)
          return next
        })
        setDeleteTarget(null)
        setDeleteUsage([])
      } else if (result.inUse && result.usedIn) {
        setDeleteUsage(result.usedIn)
      } else {
        toast.error(result.error ?? t('deleteError'))
      }
    },
    [deleteTarget, t]
  )

  // ─── Bulk Delete ───

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    const result = await bulkDeleteMedia(ids)
    if (result.success) {
      toast.success(t('bulkDeleted', { deleted: result.deleted, skipped: result.skipped }))
      setFiles((prev) => prev.filter((f) => !selectedIds.has(f.id) || result.skipped > 0))
      setSelectedIds(new Set())
      refreshFiles()
    } else {
      toast.error(result.error ?? t('deleteError'))
    }
    setShowBulkDelete(false)
  }, [selectedIds, t, refreshFiles])

  // ─── Sync ───

  const handleSync = useCallback(async () => {
    setSyncing(true)
    const result = await syncMedia()
    if (result.success) {
      toast.success(
        t('syncDone', { added: result.added ?? 0, removed: result.removed ?? 0 })
      )
      refreshFiles()
    } else {
      toast.error(result.error ?? t('syncError'))
    }
    setSyncing(false)
  }, [t, refreshFiles])

  // ─── Copy URL ───

  const handleCopyUrl = useCallback(
    async (file: MediaFile) => {
      const result = await getMediaPublicUrl(file.id)
      if (result.success && result.url) {
        await navigator.clipboard.writeText(result.url)
        setCopiedId(file.id)
        toast.success(t('urlCopied'))
        setTimeout(() => setCopiedId(null), 2000)
      }
    },
    [t]
  )

  // ─── Selection ───

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)))
    }
  }

  // ─── Drag & Drop ───

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleUpload(e.dataTransfer.files)
    },
    [handleUpload]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStorageOverview((prev) => !prev)}
        >
          <HardDrive className="mr-1.5 size-3.5" />
          {t('storageOverview')}
          {showStorageOverview ? (
            <ChevronUp className="ml-1.5 size-3.5" />
          ) : (
            <ChevronDown className="ml-1.5 size-3.5" />
          )}
        </Button>
      </div>

      {/* Storage Overview */}
      {showStorageOverview && (
        <div className="space-y-4">
          {loadingStats ? (
            <div className="flex items-center justify-center rounded-lg border py-8">
              <RefreshCw className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : storageStats ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Database className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">{t('totalStorage')}</p>
                      <p className="text-2xl font-bold">{formatFileSize(storageStats.totalSize)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Files className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">{t('totalFiles')}</p>
                      <p className="text-2xl font-bold">{storageStats.fileCount}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">{t('organizationsUsing')}</p>
                      <p className="text-2xl font-bold">{storageStats.byOrganization.length}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By Context Breakdown */}
              {storageStats.byContext.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('byContext')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {storageStats.byContext.map((ctx) => (
                      <Badge key={ctx.context} variant="secondary" className="gap-1.5 px-2.5 py-1">
                        {t(`contextLabels.${ctx.context}`)}
                        <span className="text-muted-foreground font-normal">
                          {formatFileSize(ctx.size)} ({ctx.count})
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-Organization Table */}
              {storageStats.byOrganization.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('storageByOrg')}</h3>
                  <div className="overflow-hidden rounded-lg border bg-card">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-medium">{t('orgName')}</th>
                          <th className="p-3 text-left font-medium">{t('files')}</th>
                          <th className="p-3 text-left font-medium">{t('storageUsed')}</th>
                          <th className="p-3 text-left font-medium">{t('quota')}</th>
                          <th className="p-3 text-left font-medium min-w-[150px]">{t('usage')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storageStats.byOrganization.map((org) => {
                          const usedMb = org.size / (1024 * 1024)
                          const percentage = org.quotaMb ? Math.min((usedMb / org.quotaMb) * 100, 100) : 0
                          return (
                            <tr key={org.orgId} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="p-3 font-medium">{org.orgName}</td>
                              <td className="text-muted-foreground p-3">{org.count}</td>
                              <td className="text-muted-foreground p-3">{formatFileSize(org.size)}</td>
                              <td className="text-muted-foreground p-3">
                                {org.quotaMb ? `${org.quotaMb} MB` : t('unlimited')}
                              </td>
                              <td className="p-3">
                                {org.quotaMb ? (
                                  <div className="flex items-center gap-2">
                                    <Progress
                                      value={percentage}
                                      className={cn(
                                        'h-2',
                                        percentage > 90 && '[&>[data-slot=progress-indicator]]:bg-destructive',
                                        percentage > 75 && percentage <= 90 && '[&>[data-slot=progress-indicator]]:bg-yellow-500'
                                      )}
                                    />
                                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                                      {percentage.toFixed(0)}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">&mdash;</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t('noStorageData')}</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">{t('noStorageData')}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={contextFilter} onValueChange={setContextFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allContexts')}</SelectItem>
            {CONTEXTS.map((ctx) => (
              <SelectItem key={ctx} value={ctx}>
                {t(`contextLabels.${ctx}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border rounded-md p-0.5">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            onClick={() => setView('grid')}
          >
            <Grid3x3 className="size-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            onClick={() => setView('list')}
          >
            <List className="size-4" />
          </Button>
        </div>

        <div className="flex-1" />

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {t('selected', { count: selectedIds.size })}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDelete(true)}
            >
              <Trash2 className="mr-1.5 size-3.5" />
              {t('bulkDelete')}
            </Button>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={cn('mr-1.5 size-3.5', syncing && 'animate-spin')} />
          {syncing ? t('syncing') : t('sync')}
        </Button>

        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Upload className="mr-1.5 size-3.5" />
          {t('upload')}
        </Button>
      </div>

      {/* Content */}
      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <ImageOff className="text-muted-foreground mb-3 size-10" />
          <p className="text-muted-foreground font-medium">
            {search || contextFilter !== 'all' ? t('noSearchResults') : t('noFiles')}
          </p>
          {!search && contextFilter === 'all' && (
            <p className="text-muted-foreground mt-1 text-sm">{t('noFilesHint')}</p>
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
          t={t}
        />
      ) : (
        <MediaList
          files={filteredFiles}
          selectedIds={selectedIds}
          copiedId={copiedId}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onPreview={setPreviewFile}
          onDelete={setDeleteTarget}
          onCopyUrl={handleCopyUrl}
          t={t}
        />
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('uploadFile')}</DialogTitle>
            <DialogDescription>{t('uploadHint')}</DialogDescription>
          </DialogHeader>
          <div
            ref={dragRef}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="text-muted-foreground mb-3 size-8" />
            <p className="text-muted-foreground text-sm">{t('uploadHint')}</p>
            {uploading && (
              <p className="text-primary mt-2 text-sm font-medium">{t('uploadingFile')}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
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
              {previewFile && isImage(previewFile.mimeType) ? (
                <FileImage className="size-4" />
              ) : (
                <FileText className="size-4" />
              )}
              {previewFile?.filename}
            </DialogTitle>
            <DialogDescription>
              {previewFile && formatFileSize(previewFile.size)} &middot;{' '}
              {previewFile && getExtension(previewFile.filename)} &middot;{' '}
              {previewFile && t(`contextLabels.${previewFile.context}`)}
            </DialogDescription>
          </DialogHeader>
          {previewFile && isImage(previewFile.mimeType) && (
            <div className="flex items-center justify-center rounded-lg bg-muted/50 p-4">
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${previewFile.bucket}/${previewFile.path}`}
                alt={previewFile.altText ?? previewFile.filename}
                className="max-h-[400px] rounded object-contain"
              />
            </div>
          )}
          {previewFile && !isImage(previewFile.mimeType) && (
            <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-8">
              <FileText className="text-muted-foreground mb-2 size-12" />
              <p className="text-muted-foreground text-sm">{t('preview')}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => previewFile && handleCopyUrl(previewFile)}
            >
              {copiedId === previewFile?.id ? (
                <Check className="mr-1.5 size-3.5" />
              ) : (
                <Copy className="mr-1.5 size-3.5" />
              )}
              {t('copyUrl')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (previewFile) {
                  setDeleteTarget(previewFile)
                  setPreviewFile(null)
                }
              }}
            >
              <Trash2 className="mr-1.5 size-3.5" />
              {t('deleteFile')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => {
        setDeleteTarget(null)
        setDeleteUsage([])
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget && t('deleteConfirm', { name: deleteTarget.filename })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteUsage.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-destructive text-sm font-medium">{t('inUseWarning')}</p>
              <ul className="text-destructive mt-1 list-disc pl-5 text-sm">
                {deleteUsage.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteUsage.length > 0 ? (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => handleDelete(true)}
              >
                {t('forceDelete')}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => handleDelete(false)}
              >
                {t('deleteFile')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('bulkDeleteConfirm', { count: selectedIds.size })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              {t('bulkDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Grid View ───

interface ViewProps {
  files: MediaFile[]
  selectedIds: Set<string>
  copiedId: string | null
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onPreview: (file: MediaFile) => void
  onDelete: (file: MediaFile) => void
  onCopyUrl: (file: MediaFile) => void
  t: ReturnType<typeof useTranslations<'admin.media'>>
}

function MediaGrid({
  files,
  selectedIds,
  copiedId,
  onToggleSelect,
  onToggleSelectAll,
  onPreview,
  onDelete,
  onCopyUrl,
  t,
}: ViewProps) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Checkbox
          checked={selectedIds.size === files.length && files.length > 0}
          onCheckedChange={onToggleSelectAll}
        />
        <span className="text-muted-foreground text-xs">
          {selectedIds.size > 0
            ? t('selected', { count: selectedIds.size })
            : t('selectAll')}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              'group relative rounded-lg border bg-card transition-all hover:shadow-md',
              selectedIds.has(file.id) && 'ring-primary ring-2'
            )}
          >
            {/* Selection checkbox */}
            <div className="absolute left-2 top-2 z-10">
              <Checkbox
                checked={selectedIds.has(file.id)}
                onCheckedChange={() => onToggleSelect(file.id)}
                className="bg-background/80 backdrop-blur-sm"
              />
            </div>

            {/* Thumbnail */}
            <button
              className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-t-lg bg-muted/50"
              onClick={() => onPreview(file)}
            >
              {isImage(file.mimeType) ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.bucket}/${file.path}`}
                  alt={file.altText ?? file.filename}
                  className="size-full object-cover"
                />
              ) : (
                <FileText className="text-muted-foreground size-10" />
              )}
            </button>

            {/* Info */}
            <div className="p-2">
              <p className="truncate text-xs font-medium" title={file.filename}>
                {file.filename}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-muted-foreground text-[10px]">
                  {formatFileSize(file.size)}
                </span>
                <Badge variant="outline" className="h-4 px-1 text-[9px]">
                  {t(`contextLabels.${file.context}`)}
                </Badge>
              </div>
            </div>

            {/* Actions overlay */}
            <div className="absolute right-1.5 top-1.5 z-10 opacity-0 transition-opacity group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 bg-background/80 backdrop-blur-sm"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPreview(file)}>
                    <Eye className="mr-2 size-4" />
                    {t('preview')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCopyUrl(file)}>
                    {copiedId === file.id ? (
                      <Check className="mr-2 size-4" />
                    ) : (
                      <Copy className="mr-2 size-4" />
                    )}
                    {t('copyUrl')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(file)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {t('deleteFile')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── List View ───

function MediaList({
  files,
  selectedIds,
  copiedId,
  onToggleSelect,
  onToggleSelectAll,
  onPreview,
  onDelete,
  onCopyUrl,
  t,
}: ViewProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="w-10 p-3">
              <Checkbox
                checked={selectedIds.size === files.length && files.length > 0}
                onCheckedChange={onToggleSelectAll}
              />
            </th>
            <th className="p-3 text-left font-medium">{t('fileName')}</th>
            <th className="p-3 text-left font-medium">{t('fileSize')}</th>
            <th className="p-3 text-left font-medium">{t('context')}</th>
            <th className="p-3 text-left font-medium">{t('uploadedAt')}</th>
            <th className="w-10 p-3" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr
              key={file.id}
              className={cn(
                'border-b transition-colors last:border-0 hover:bg-muted/30',
                selectedIds.has(file.id) && 'bg-primary/5'
              )}
            >
              <td className="p-3">
                <Checkbox
                  checked={selectedIds.has(file.id)}
                  onCheckedChange={() => onToggleSelect(file.id)}
                />
              </td>
              <td className="p-3">
                <button
                  className="flex items-center gap-2.5 text-left hover:underline"
                  onClick={() => onPreview(file)}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-muted/50">
                    {isImage(file.mimeType) ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${file.bucket}/${file.path}`}
                        alt={file.altText ?? file.filename}
                        className="size-full object-cover"
                      />
                    ) : (
                      <FileText className="text-muted-foreground size-4" />
                    )}
                  </div>
                  <div>
                    <p className="truncate font-medium max-w-[300px]">{file.filename}</p>
                    <p className="text-muted-foreground text-xs">
                      {getExtension(file.filename)}
                    </p>
                  </div>
                </button>
              </td>
              <td className="text-muted-foreground p-3">
                {formatFileSize(file.size)}
              </td>
              <td className="p-3">
                <Badge variant="outline" className="text-xs">
                  {t(`contextLabels.${file.context}`)}
                </Badge>
              </td>
              <td className="text-muted-foreground p-3">
                {new Date(file.createdAt).toLocaleDateString()}
              </td>
              <td className="p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPreview(file)}>
                      <Eye className="mr-2 size-4" />
                      {t('preview')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopyUrl(file)}>
                      {copiedId === file.id ? (
                        <Check className="mr-2 size-4" />
                      ) : (
                        <Copy className="mr-2 size-4" />
                      )}
                      {t('copyUrl')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(file)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t('deleteFile')}
                    </DropdownMenuItem>
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
