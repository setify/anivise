'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { formatDistanceToNow, type Locale } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
  BarChart3,
  RefreshCw,
  Wifi,
  WifiOff,
  RotateCcw,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  getAnalysisJobs,
  cancelAnalysisJob,
  retryAnalysisJob,
  checkN8nHealthAction,
} from '../actions'
import { toast } from 'sonner'

interface Job {
  id: string
  organizationId: string
  subjectId: string
  requestedBy: string
  status: string
  errorMessage: string | null
  n8nWebhookTriggeredAt: Date | null
  n8nCallbackReceivedAt: Date | null
  createdAt: Date
  updatedAt: Date
  orgName: string | null
  orgSlug: string | null
}

interface JobStats {
  pending: number
  processing: number
  completed: number
  failed: number
  cancelled: number
  total: number
}

interface N8nHealth {
  connected: boolean
  url: string | null
  responseTime: number | null
  error: string | null
  checkedAt: Date
}

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; bgColor: string }
> = {
  pending: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  processing: { icon: Loader2, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  completed: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  failed: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  cancelled: { icon: Ban, color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-900/30' },
}

export function JobsPageClient({
  initialJobs,
  initialTotal,
  stats,
  organizations,
}: {
  initialJobs: Job[]
  initialTotal: number
  stats: JobStats
  organizations: { id: string; name: string }[]
}) {
  const t = useTranslations('admin.jobs')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS
  const [isPending, startTransition] = useTransition()

  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [total, setTotal] = useState(initialTotal)
  const [statusFilter, setStatusFilter] = useState('all')
  const [orgFilter, setOrgFilter] = useState('all')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const [n8nHealth, setN8nHealth] = useState<N8nHealth | null>(null)
  const [checkingHealth, setCheckingHealth] = useState(false)

  function loadJobs(newStatus?: string, newOrg?: string, newOffset?: number) {
    const activeStatus = newStatus ?? statusFilter
    const activeOrg = newOrg ?? orgFilter
    const activeOffset = newOffset ?? 0

    startTransition(async () => {
      const result = await getAnalysisJobs({
        status: activeStatus,
        organizationId: activeOrg,
        offset: activeOffset,
        limit,
      })
      setJobs(result.jobs as Job[])
      setTotal(result.total)
      setOffset(activeOffset)
    })
  }

  async function handleCheckHealth() {
    setCheckingHealth(true)
    try {
      const result = await checkN8nHealthAction()
      setN8nHealth(result as N8nHealth)
    } finally {
      setCheckingHealth(false)
    }
  }

  async function handleCancel(jobId: string) {
    const result = await cancelAnalysisJob(jobId)
    if (result.success) {
      toast.success(t('jobCancelled'), { className: 'rounded-full', position: 'top-center' })
      loadJobs()
    } else {
      toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
    }
  }

  async function handleRetry(jobId: string) {
    const result = await retryAnalysisJob(jobId)
    if (result.success) {
      toast.success(t('jobRetried'), { className: 'rounded-full', position: 'top-center' })
      loadJobs()
    } else {
      toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
    }
  }

  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* n8n Health Check */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t('n8nHealth.title')}</CardTitle>
              <CardDescription>{t('n8nHealth.description')}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckHealth}
              disabled={checkingHealth}
            >
              {checkingHealth ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 size-4" />
              )}
              {t('n8nHealth.check')}
            </Button>
          </div>
        </CardHeader>
        {n8nHealth && (
          <CardContent>
            <div className="flex items-center gap-3">
              {n8nHealth.connected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Wifi className="size-5" />
                  <span className="text-sm font-medium">{t('n8nHealth.connected')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <WifiOff className="size-5" />
                  <span className="text-sm font-medium">{t('n8nHealth.disconnected')}</span>
                </div>
              )}
              {n8nHealth.responseTime != null && (
                <span className="text-muted-foreground text-sm">
                  {n8nHealth.responseTime}ms
                </span>
              )}
              {n8nHealth.url && (
                <span className="text-muted-foreground truncate text-xs">
                  {n8nHealth.url}
                </span>
              )}
              {n8nHealth.error && (
                <span className="text-destructive text-xs">{n8nHealth.error}</span>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatMini
          label={t('stats.total')}
          value={stats.total}
          icon={BarChart3}
          color="text-foreground"
        />
        <StatMini
          label={t('stats.pending')}
          value={stats.pending}
          icon={Clock}
          color="text-amber-600"
        />
        <StatMini
          label={t('stats.processing')}
          value={stats.processing}
          icon={Loader2}
          color="text-blue-600"
        />
        <StatMini
          label={t('stats.completed')}
          value={stats.completed}
          icon={CheckCircle2}
          color="text-green-600"
        />
        <StatMini
          label={t('stats.failed')}
          value={stats.failed}
          icon={XCircle}
          color="text-red-600"
        />
        <StatMini
          label={t('stats.cancelled')}
          value={stats.cancelled}
          icon={Ban}
          color="text-slate-500"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                loadJobs(v, undefined, 0)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('statusPending')}</SelectItem>
                <SelectItem value="processing">{t('statusProcessing')}</SelectItem>
                <SelectItem value="completed">{t('statusCompleted')}</SelectItem>
                <SelectItem value="failed">{t('statusFailed')}</SelectItem>
                <SelectItem value="cancelled">{t('statusCancelled')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={orgFilter}
              onValueChange={(v) => {
                setOrgFilter(v)
                loadJobs(undefined, v, 0)
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allOrganizations')}</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {t('tableTitle')}
            </CardTitle>
            <span className="text-muted-foreground text-sm">
              {t('totalJobs', { count: total })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="text-muted-foreground mb-3 size-10" />
              <p className="text-muted-foreground text-sm">{t('noJobs')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('columnId')}</TableHead>
                    <TableHead>{t('columnOrg')}</TableHead>
                    <TableHead>{t('columnStatus')}</TableHead>
                    <TableHead>{t('columnCreated')}</TableHead>
                    <TableHead>{t('columnN8nTriggered')}</TableHead>
                    <TableHead>{t('columnN8nCallback')}</TableHead>
                    <TableHead>{t('columnActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending
                    const StatusIcon = config.icon

                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-xs">
                          {job.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{job.orgName ?? '—'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${config.bgColor} border-0`}>
                            <StatusIcon className={`size-3 ${config.color} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                            <span className={config.color}>{t(`status${capitalize(job.status)}`)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(job.createdAt), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {job.n8nWebhookTriggeredAt
                            ? formatDistanceToNow(new Date(job.n8nWebhookTriggeredAt), {
                                addSuffix: true,
                                locale: dateLocale,
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {job.n8nCallbackReceivedAt
                            ? formatDistanceToNow(new Date(job.n8nCallbackReceivedAt), {
                                addSuffix: true,
                                locale: dateLocale,
                              })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(job.status === 'failed' || job.status === 'cancelled') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleRetry(job.id)}
                              >
                                <RotateCcw className="mr-1 size-3" />
                                {t('retry')}
                              </Button>
                            )}
                            {(job.status === 'pending' || job.status === 'processing') && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive h-7 text-xs"
                                  >
                                    <Ban className="mr-1 size-3" />
                                    {t('cancel')}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('cancelConfirmTitle')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('cancelConfirmDescription')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancelNo')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleCancel(job.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {t('cancelYes')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {job.errorMessage && (
                              <span className="text-destructive max-w-[200px] truncate text-xs" title={job.errorMessage}>
                                {job.errorMessage}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t('pageInfo', { from, to, total })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0 || isPending}
              onClick={() => loadJobs(undefined, undefined, Math.max(0, offset - limit))}
            >
              <ChevronLeft className="mr-1 size-4" />
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + limit >= total || isPending}
              onClick={() => loadJobs(undefined, undefined, offset + limit)}
            >
              {t('nextPage')}
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatMini({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: typeof Clock
  color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className={`size-5 shrink-0 ${color}`} />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
