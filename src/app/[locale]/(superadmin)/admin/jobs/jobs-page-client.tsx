'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import Link from 'next/link'
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
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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

const AUTO_REFRESH_INTERVAL = 10_000

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

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check if there are active (pending/processing) jobs
  const hasActiveJobs = jobs.some(
    (job) => job.status === 'pending' || job.status === 'processing'
  )

  const loadJobs = useCallback(
    function loadJobs(newStatus?: string, newOrg?: string, newOffset?: number) {
      const activeStatus = newStatus ?? statusFilter
      const activeOrg = newOrg ?? orgFilter
      const activeOffset = newOffset ?? offset

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
    },
    [statusFilter, orgFilter, offset, limit]
  )

  // Auto-refresh effect
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Only set up auto-refresh if enabled AND there are active jobs
    if (autoRefreshEnabled && hasActiveJobs) {
      intervalRef.current = setInterval(() => {
        loadJobs()
      }, AUTO_REFRESH_INTERVAL)
    }

    // Auto-disable when no active jobs
    if (autoRefreshEnabled && !hasActiveJobs) {
      setAutoRefreshEnabled(false)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoRefreshEnabled, hasActiveJobs, loadJobs])

  function handleFilterChange(newStatus?: string, newOrg?: string) {
    const activeStatus = newStatus ?? statusFilter
    const activeOrg = newOrg ?? orgFilter

    if (newStatus !== undefined) setStatusFilter(activeStatus)
    if (newOrg !== undefined) setOrgFilter(activeOrg)

    loadJobs(activeStatus, activeOrg, 0)
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

      {/* Filters + Auto-Refresh */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => handleFilterChange(v, undefined)}
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
              onValueChange={(v) => handleFilterChange(undefined, v)}
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

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onCheckedChange={setAutoRefreshEnabled}
                  disabled={!hasActiveJobs}
                />
                <Label
                  htmlFor="auto-refresh"
                  className="flex items-center gap-1.5 text-sm"
                >
                  {t('autoRefresh')}
                  {autoRefreshEnabled && hasActiveJobs && (
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                    </span>
                  )}
                </Label>
              </div>
            </div>
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
                      <TableRow key={job.id} className="group">
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/${locale}/admin/jobs/${job.id}`}
                            className="text-primary hover:underline"
                          >
                            {job.id.slice(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{job.orgName ?? '\u2014'}</span>
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
                            : '\u2014'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {job.n8nCallbackReceivedAt
                            ? formatDistanceToNow(new Date(job.n8nCallbackReceivedAt), {
                                addSuffix: true,
                                locale: dateLocale,
                              })
                            : '\u2014'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              asChild
                            >
                              <Link href={`/${locale}/admin/jobs/${job.id}`}>
                                <ExternalLink className="mr-1 size-3" />
                                {t('viewDetail')}
                              </Link>
                            </Button>
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
