'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Download,
  Clock,
  BarChart3,
  TrendingUp,
  Inbox,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
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
import { StatCard } from '@/components/admin/stat-card'
import { getSubmissions, deleteSubmission } from './actions'
import type { Form } from '@/types/database'
import type { FormSchema, FormField } from '@/types/form-schema'

interface SubmissionRow {
  id: string
  data: unknown
  metadata: unknown
  submittedAt: Date
  orgId: string | null
  orgName: string | null
  userName: string | null
  userEmail: string | null
  versionNumber: number | null
}

interface SubmissionsPageClientProps {
  form: Form
  schema: FormSchema
  stats: {
    total: number
    thisWeek: number
    avgDuration: number
  }
  initialSubmissions: SubmissionRow[]
  total: number
  organizations: { id: string; name: string }[]
  versions: { versionNumber: number; publishedAt: Date | null }[]
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

export function SubmissionsPageClient({
  form,
  schema,
  stats,
  initialSubmissions,
  total,
  organizations,
  versions,
}: SubmissionsPageClientProps) {
  const t = useTranslations('admin.forms.submissions')
  const locale = useLocale()
  const router = useRouter()
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [totalCount, setTotalCount] = useState(total)
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterOrg, setFilterOrg] = useState<string>('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterVersion, setFilterVersion] = useState<string>('')

  // Get all fields for table columns
  const allFields: FormField[] = schema.steps.flatMap((step) => step.fields)
  const displayFields = allFields.filter((f) => f.type !== 'hidden').slice(0, 4) // Show first 4 fields as columns

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return '–'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
  }

  const applyFilters = useCallback(async () => {
    const result = await getSubmissions(form.id, {
      organizationId: filterOrg || undefined,
      fromDate: filterFrom || undefined,
      toDate: filterTo || undefined,
      versionNumber: filterVersion ? Number(filterVersion) : undefined,
    })
    setSubmissions(result.submissions)
    setTotalCount(result.total)
  }, [form.id, filterOrg, filterFrom, filterTo, filterVersion])

  const handleDelete = async () => {
    if (!deleteId) return
    const result = await deleteSubmission(deleteId)
    if (result.success) {
      toast.success(t('deleted'), { className: 'rounded-full' })
      setDeleteId(null)
      setSelectedSubmission(null)
      await applyFilters()
    } else {
      toast.error(result.error ?? t('deleteError'), { className: 'rounded-full' })
    }
  }

  const exportUrl = (format: string) => {
    const params = new URLSearchParams({ format })
    if (filterOrg) params.set('organizationId', filterOrg)
    if (filterFrom) params.set('fromDate', filterFrom)
    if (filterTo) params.set('toDate', filterTo)
    if (filterVersion) params.set('version', filterVersion)
    return `/api/admin/forms/${form.id}/submissions/export?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/admin/forms`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{form.title}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="mr-2 size-4" />
              {t('export')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={exportUrl('csv')} download>
                <FileText className="mr-2 size-4" />
                {t('exportCsv')}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={exportUrl('xlsx')} download>
                <FileSpreadsheet className="mr-2 size-4" />
                {t('exportXlsx')}
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t('totalSubmissions')}
          value={stats.total}
          icon={Inbox}
        />
        <StatCard
          title={t('thisWeek')}
          value={stats.thisWeek}
          icon={TrendingUp}
        />
        <StatCard
          title={t('avgDuration')}
          value={stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : '–'}
          icon={Clock}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {organizations.length > 0 && (
          <Select value={filterOrg} onValueChange={(v) => { setFilterOrg(v === '__all__' ? '' : v); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('filterOrganization')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('allOrganizations')}</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          placeholder={t('fromDate')}
          className="w-[160px]"
        />
        <Input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          placeholder={t('toDate')}
          className="w-[160px]"
        />

        {versions.length > 1 && (
          <Select value={filterVersion} onValueChange={(v) => { setFilterVersion(v === '__all__' ? '' : v); }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('filterVersion')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('allVersions')}</SelectItem>
              {versions.map((v) => (
                <SelectItem key={v.versionNumber} value={String(v.versionNumber)}>
                  v{v.versionNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" onClick={applyFilters}>
          {t('applyFilters')}
        </Button>
      </div>

      {/* Table */}
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Inbox className="text-muted-foreground mb-4 size-12" />
          <p className="text-muted-foreground text-sm">{t('noSubmissions')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {displayFields.map((field) => (
                  <TableHead key={field.id} className="min-w-[120px]">
                    {field.label}
                  </TableHead>
                ))}
                <TableHead>{t('columnOrg')}</TableHead>
                <TableHead>{t('columnUser')}</TableHead>
                <TableHead>{t('columnDate')}</TableHead>
                <TableHead>{t('columnVersion')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => {
                const data = (sub.data ?? {}) as Record<string, unknown>

                return (
                  <TableRow
                    key={sub.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedSubmission(sub)}
                  >
                    {displayFields.map((field) => (
                      <TableCell key={field.id} className="max-w-[200px] truncate">
                        {formatFieldValue(data[field.id])}
                      </TableCell>
                    ))}
                    <TableCell>{sub.orgName ?? '–'}</TableCell>
                    <TableCell>{sub.userName ?? sub.userEmail ?? '–'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(sub.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">v{sub.versionNumber}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalCount > submissions.length && (
        <p className="text-muted-foreground text-center text-sm">
          {t('showingOf', { shown: submissions.length, total: totalCount })}
        </p>
      )}

      {/* Submission Detail Dialog */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={() => setSelectedSubmission(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('submissionDetail')}</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6 py-4">
              {/* Metadata */}
              <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('columnOrg')}:</span>{' '}
                    <span className="font-medium">{selectedSubmission.orgName ?? '–'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('columnUser')}:</span>{' '}
                    <span className="font-medium">
                      {selectedSubmission.userName ?? selectedSubmission.userEmail ?? '–'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('columnDate')}:</span>{' '}
                    <span className="font-medium">
                      {formatDate(selectedSubmission.submittedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('columnVersion')}:</span>{' '}
                    <span className="font-medium">v{selectedSubmission.versionNumber}</span>
                  </div>
                  {typeof (selectedSubmission.metadata as Record<string, unknown>)?.duration === 'number' && (
                    <div>
                      <span className="text-muted-foreground">{t('duration')}:</span>{' '}
                      <span className="font-medium">
                        {formatDuration(
                          (selectedSubmission.metadata as Record<string, unknown>).duration as number
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Field values */}
              <div className="space-y-4">
                {schema.steps.map((step) => (
                  <div key={step.id}>
                    {schema.steps.length > 1 && (
                      <h3 className="mb-3 text-base font-semibold">{step.title}</h3>
                    )}
                    <div className="space-y-3">
                      {step.fields
                        .filter((f) => f.type !== 'hidden')
                        .map((field) => {
                          const data = (selectedSubmission.data ?? {}) as Record<string, unknown>
                          return (
                            <div key={field.id} className="rounded-lg border p-3">
                              <p className="text-muted-foreground text-xs font-medium">
                                {field.label}
                              </p>
                              <p className="mt-1 text-sm">
                                {formatFieldValue(data[field.id])}
                              </p>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delete button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteId(selectedSubmission.id)}
              >
                <Trash2 className="mr-2 size-4" />
                {t('deleteSubmission')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancelDelete')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('confirmDelete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
