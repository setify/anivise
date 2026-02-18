'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Upload,
  Mic,
  ClipboardList,
  Play,
  Pencil,
  MoreHorizontal,
  Archive,
  ArchiveRestore,
  Trash2,
  Share2,
  UserCog,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import { CommentFeed } from '../_components/comment-feed'
import { ShareDialog } from '../_components/share-dialog'
import {
  updateAnalysis,
  changeAnalysisStatus,
  toggleArchiveAnalysis,
  deleteAnalysis,
  changeAnalysisManager,
} from '../actions'
import type {
  AnalysisDetail,
  AnalysisCommentRow,
  AnalysisShareRow,
  OrgManager,
} from '../actions'
import type { AnalysisStatus } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

interface AnalysisDetailClientProps {
  analysis: AnalysisDetail
  comments: AnalysisCommentRow[]
  shares: AnalysisShareRow[]
  managers: OrgManager[]
  isAdmin: boolean
  currentUserId: string
}

export function AnalysisDetailClient({
  analysis,
  comments,
  shares,
  managers,
  isAdmin,
  currentUserId,
}: AnalysisDetailClientProps) {
  const t = useTranslations('analyses')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameLoading, setRenameLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [managerLoading, setManagerLoading] = useState(false)
  const [newManagerId, setNewManagerId] = useState(analysis.managerId)

  async function handleRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setRenameLoading(true)
    const form = new FormData(e.currentTarget)
    form.set('id', analysis.id)
    const result = await updateAnalysis(form)
    setRenameLoading(false)
    if (result.success) {
      toast.success(t('rename.success'))
      setRenameOpen(false)
    } else {
      toast.error(t('rename.error'))
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    const result = await deleteAnalysis(analysis.id)
    setDeleteLoading(false)
    if (result.success) {
      toast.success(t('delete.success'))
      router.push(`/${locale}/analyses`)
    } else {
      toast.error(t('delete.error'))
    }
  }

  async function handleStatusChange(status: AnalysisStatus) {
    await changeAnalysisStatus(analysis.id, status)
  }

  async function handleArchive() {
    await toggleArchiveAnalysis(analysis.id)
  }

  async function handleManagerChange() {
    setManagerLoading(true)
    const result = await changeAnalysisManager(analysis.id, newManagerId)
    setManagerLoading(false)
    if (result.success) {
      toast.success(t('detail.managerChange.success'))
      setManagerOpen(false)
    } else {
      toast.error(t('detail.managerChange.error'))
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/analyses`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {analysis.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {analysis.employeeName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <Play className="mr-2 size-4" />
            {t('actions.runAnalysis')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="mr-2 size-3.5" />
                {t('actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShareOpen(true)}>
                <Share2 className="mr-2 size-3.5" />
                {t('actions.share')}
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => setManagerOpen(true)}>
                  <UserCog className="mr-2 size-3.5" />
                  {t('actions.changeManager')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {/* Status changes */}
              {analysis.status !== 'planned' && (
                <DropdownMenuItem onClick={() => handleStatusChange('planned')}>
                  {t('status.planned')}
                </DropdownMenuItem>
              )}
              {analysis.status !== 'active' && (
                <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                  {t('status.active')}
                </DropdownMenuItem>
              )}
              {analysis.status !== 'completed' && (
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  {t('status.completed')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                {analysis.archived ? (
                  <><ArchiveRestore className="mr-2 size-3.5" />{t('actions.unarchive')}</>
                ) : (
                  <><Archive className="mr-2 size-3.5" />{t('actions.archive')}</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-3.5" />
                {t('actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 60/40 Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left: Content area */}
        <div className="space-y-6">
          {/* Recording placeholder */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8">
            <Mic className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm font-medium">
              {t('detail.recording.title')}
            </p>
            <p className="text-muted-foreground text-center text-xs">
              {t('detail.recording.description')}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Upload className="mr-2 size-3.5" />
                {t('detail.recording.upload')}
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Mic className="mr-2 size-3.5" />
                {t('detail.recording.start')}
              </Button>
            </div>
          </div>

          {/* Forms placeholder */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8">
            <ClipboardList className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm font-medium">
              {t('detail.forms.title')}
            </p>
            <p className="text-muted-foreground text-center text-xs">
              {t('detail.forms.description')}
            </p>
            <Button variant="outline" size="sm" disabled>
              <ClipboardList className="mr-2 size-3.5" />
              {t('detail.forms.select')}
            </Button>
          </div>
        </div>

        {/* Right: Info sidebar (sticky) */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {/* Status & Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('detail.info.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {t('detail.info.status')}
                </span>
                <Badge
                  variant="secondary"
                  className={STATUS_COLORS[analysis.status]}
                >
                  {t(`status.${analysis.status}`)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {t('detail.info.manager')}
                </span>
                <span className="text-sm font-medium">
                  {analysis.managerName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {t('detail.info.created')}
                </span>
                <span className="text-sm">
                  {formatDate(analysis.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {t('detail.info.updated')}
                </span>
                <span className="text-sm">
                  {formatDate(analysis.updatedAt)}
                </span>
              </div>
              {analysis.archived && (
                <Badge variant="outline">Archiviert</Badge>
              )}
            </CardContent>
          </Card>

          {/* Employee Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('detail.employee.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <AvatarDisplay
                  name={analysis.employeeName}
                  email={analysis.employeeEmail ?? undefined}
                  avatarUrl={analysis.employeeAvatarUrl ?? undefined}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="font-medium">{analysis.employeeName}</p>
                  {analysis.employeePosition && (
                    <p className="text-muted-foreground text-sm">
                      {analysis.employeePosition}
                    </p>
                  )}
                  {analysis.employeeEmail && (
                    <p className="text-muted-foreground truncate text-xs">
                      {analysis.employeeEmail}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes / Comment Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('detail.notes.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentFeed
                analysisId={analysis.id}
                comments={comments}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('rename.title')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('rename.name')}</Label>
              <Input name="name" required defaultValue={analysis.name} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={renameLoading}>
                {renameLoading ? t('rename.saving') : t('rename.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('delete.title')}</DialogTitle>
            <DialogDescription>
              {t('delete.description', { name: analysis.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? tCommon('loading') : t('delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        analysisId={analysis.id}
        shares={shares}
        managers={managers}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      {/* Change Manager Dialog */}
      {isAdmin && (
        <Dialog open={managerOpen} onOpenChange={setManagerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('detail.managerChange.title')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('detail.managerChange.select')}</Label>
                <Select value={newManagerId} onValueChange={setNewManagerId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setManagerOpen(false)}
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  onClick={handleManagerChange}
                  disabled={
                    managerLoading || newManagerId === analysis.managerId
                  }
                >
                  {managerLoading
                    ? t('detail.managerChange.saving')
                    : t('detail.managerChange.save')}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
