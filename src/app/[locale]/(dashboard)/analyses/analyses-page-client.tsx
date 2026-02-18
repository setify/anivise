'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Plus,
  AudioWaveform,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateAnalysisDialog } from './_components/create-analysis-dialog'
import {
  toggleArchiveAnalysis,
  deleteAnalysis,
  changeAnalysisStatus,
} from './actions'
import type { AnalysisRow, ActiveEmployee, OrgManager } from './actions'
import type { AnalysisStatus } from '@/types/database'

interface AnalysesPageClientProps {
  analyses: AnalysisRow[]
  employees: ActiveEmployee[]
  managers: OrgManager[]
  isAdmin: boolean
  currentUserId: string
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export function AnalysesPageClient({
  analyses,
  employees,
  managers,
  isAdmin,
  currentUserId,
}: AnalysesPageClientProps) {
  const t = useTranslations('analyses')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [createOpen, setCreateOpen] = useState(false)
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('__all__')
  const [managerFilter, setManagerFilter] = useState<string>('__all__')
  const [deleteTarget, setDeleteTarget] = useState<AnalysisRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Unique managers for filter
  const managerOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of analyses) {
      map.set(a.managerId, a.managerName)
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [analyses])

  // Filter
  const filtered = useMemo(() => {
    let list = analyses.filter((a) =>
      tab === 'archived' ? a.archived : !a.archived
    )

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.employeeName.toLowerCase().includes(q) ||
          a.managerName.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== '__all__') {
      list = list.filter((a) => a.status === statusFilter)
    }

    if (managerFilter !== '__all__') {
      list = list.filter((a) => a.managerId === managerFilter)
    }

    return list
  }, [analyses, tab, search, statusFilter, managerFilter])

  async function handleArchive(analysis: AnalysisRow) {
    await toggleArchiveAnalysis(analysis.id)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteAnalysis(deleteTarget.id)
    setDeleting(false)
    if (result.success) {
      toast.success(t('delete.success'))
      setDeleteTarget(null)
    } else {
      toast.error(t('delete.error'))
    }
  }

  async function handleStatusChange(id: string, status: AnalysisStatus) {
    await changeAnalysisStatus(id, status)
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t('newAnalysis')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'archived')}>
        <TabsList>
          <TabsTrigger value="active">{t('tabs.active')}</TabsTrigger>
          <TabsTrigger value="archived">{t('tabs.archived')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      {analyses.length > 0 && (
        <div className="flex items-center gap-3">
          <Input
            placeholder={t('filter.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('filter.allStatuses')}</SelectItem>
              <SelectItem value="planned">{t('status.planned')}</SelectItem>
              <SelectItem value="active">{t('status.active')}</SelectItem>
              <SelectItem value="completed">{t('status.completed')}</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && managerOptions.length > 1 && (
            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('filter.allManagers')}</SelectItem>
                {managerOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <AudioWaveform className="text-muted-foreground mb-3 size-10" />
          <p className="text-muted-foreground text-sm font-medium">
            {t('emptyTitle')}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.employee')}</TableHead>
                  <TableHead>{t('table.manager')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.createdAt')}</TableHead>
                  <TableHead>{t('table.updatedAt')}</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((analysis) => (
                  <TableRow
                    key={analysis.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/${locale}/analyses/${analysis.id}`)
                    }
                  >
                    <TableCell>
                      <span className="font-medium">{analysis.name}</span>
                    </TableCell>
                    <TableCell>{analysis.employeeName}</TableCell>
                    <TableCell>{analysis.managerName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[analysis.status]}
                      >
                        {t(`status.${analysis.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(analysis.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(analysis.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Status changes */}
                          {analysis.status !== 'planned' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(analysis.id, 'planned')
                              }}
                            >
                              {t('status.planned')}
                            </DropdownMenuItem>
                          )}
                          {analysis.status !== 'active' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(analysis.id, 'active')
                              }}
                            >
                              {t('status.active')}
                            </DropdownMenuItem>
                          )}
                          {analysis.status !== 'completed' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(analysis.id, 'completed')
                              }}
                            >
                              {t('status.completed')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleArchive(analysis)
                            }}
                          >
                            {analysis.archived ? (
                              <>
                                <ArchiveRestore className="mr-2 size-3.5" />
                                {t('actions.unarchive')}
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 size-3.5" />
                                {t('actions.archive')}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(analysis)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-3.5" />
                            {t('actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateAnalysisDialog
        employees={employees}
        managers={managers}
        isAdmin={isAdmin}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('delete.title')}</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? t('delete.description', { name: deleteTarget.name })
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? tCommon('loading') : t('delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
