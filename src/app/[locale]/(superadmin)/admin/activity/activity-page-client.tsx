'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  User,
  Building2,
  Mail,
  Shield,
  Settings,
  Eye,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAuditLogs, exportAuditLogs } from '../actions'

interface AuditLogEntry {
  id: string
  actorId: string
  actorEmail: string
  action: string
  entityType: string
  entityId: string | null
  organizationId: string | null
  metadata: unknown
  ipAddress: string | null
  createdAt: Date
}

interface Props {
  initialLogs: AuditLogEntry[]
  initialTotal: number
}

const PAGE_SIZE = 50

const ACTION_CATEGORIES = [
  'all',
  'org',
  'team',
  'org_member',
  'invitation',
  'profile',
  'settings',
  'impersonation',
  'analysis_job',
] as const

type ActionCategory = (typeof ACTION_CATEGORIES)[number]

function getActionIcon(action: string) {
  if (action.startsWith('org.')) return Building2
  if (action.startsWith('team.')) return Shield
  if (action.startsWith('org_member.')) return User
  if (action.startsWith('invitation.')) return Mail
  if (action.startsWith('profile.')) return User
  if (action.startsWith('settings.')) return Settings
  if (action.startsWith('impersonation.')) return Eye
  if (action.startsWith('analysis_job.')) return RefreshCw
  return Activity
}

function getActionColor(action: string): string {
  if (action.includes('created') || action.includes('invited') || action.includes('accepted'))
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  if (action.includes('deleted') || action.includes('removed') || action.includes('cancelled'))
    return 'bg-red-500/10 text-red-600 dark:text-red-400'
  if (action.includes('updated') || action.includes('changed') || action.includes('resent'))
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  if (action.includes('started'))
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  if (action.includes('ended'))
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
  return 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
}

export function ActivityPageClient({ initialLogs, initialTotal }: Props) {
  const t = useTranslations('admin.activity')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(0)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [exporting, setExporting] = useState(false)

  const dateLocale = locale === 'de' ? de : enUS
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function fetchLogs(newPage: number, action?: string, period?: string) {
    const currentAction = action ?? actionFilter
    const currentPeriod = period ?? periodFilter

    startTransition(async () => {
      const result = await getAuditLogs({
        action: currentAction === 'all' ? undefined : currentAction,
        period: currentPeriod as 'day' | 'week' | 'month' | 'all',
        offset: newPage * PAGE_SIZE,
        limit: PAGE_SIZE,
      })
      setLogs(result.logs as AuditLogEntry[])
      setTotal(result.total)
      setPage(newPage)
    })
  }

  function handleActionFilter(value: string) {
    setActionFilter(value)
    fetchLogs(0, value, undefined)
  }

  function handlePeriodFilter(value: string) {
    setPeriodFilter(value)
    fetchLogs(0, undefined, value)
  }

  async function handleExportCSV() {
    setExporting(true)
    try {
      const result = await exportAuditLogs({
        action: actionFilter === 'all' ? undefined : actionFilter,
        period: periodFilter as 'day' | 'week' | 'month' | 'all',
      })
      if (result.success && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
        toast.success(t('exportSuccess'))
      } else {
        toast.error(t('exportError'))
      }
    } finally {
      setExporting(false)
    }
  }

  function formatMetadata(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== 'object') return null
    const m = metadata as Record<string, unknown>
    const parts: string[] = []
    if (m.email) parts.push(String(m.email))
    if (m.name) parts.push(String(m.name))
    if (m.slug) parts.push(String(m.slug))
    if (m.oldRole && m.newRole) parts.push(`${m.oldRole} → ${m.newRole}`)
    if (m.role && !m.oldRole) parts.push(String(m.role))
    return parts.length > 0 ? parts.join(' · ') : null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="size-4" />
                {t('filters')}
              </CardTitle>
              <CardDescription>{t('filtersDescription')}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={exporting}
            >
              <Download className="mr-2 size-4" />
              {exporting ? t('exporting') : t('exportCSV')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={actionFilter} onValueChange={handleActionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t('actionFilter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allActions')}</SelectItem>
                {ACTION_CATEGORIES.filter((c) => c !== 'all').map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(`categories.${category}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={handlePeriodFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t('periodFilter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTime')}</SelectItem>
                <SelectItem value="day">{t('last24h')}</SelectItem>
                <SelectItem value="week">{t('last7d')}</SelectItem>
                <SelectItem value="month">{t('last30d')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('logTitle')}</CardTitle>
          <CardDescription>
            {t('totalEntries', { count: total })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="text-muted-foreground mb-3 size-10" />
              <p className="text-muted-foreground text-sm">{t('noLogs')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">{t('columnTime')}</TableHead>
                      <TableHead>{t('columnAction')}</TableHead>
                      <TableHead>{t('columnActor')}</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t('columnDetails')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const Icon = getActionIcon(log.action)
                      const colorClass = getActionColor(log.action)
                      const meta = formatMetadata(log.metadata)
                      return (
                        <TableRow key={log.id} className={isPending ? 'opacity-50' : ''}>
                          <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                            {formatDistanceToNow(new Date(log.createdAt), {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`rounded-md p-1.5 ${colorClass}`}>
                                <Icon className="size-3.5" />
                              </div>
                              <Badge variant="outline" className="font-mono text-xs">
                                {log.action}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.actorEmail}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                            {meta || '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    {t('pageInfo', {
                      from: page * PAGE_SIZE + 1,
                      to: Math.min((page + 1) * PAGE_SIZE, total),
                      total,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0 || isPending}
                      onClick={() => fetchLogs(page - 1)}
                    >
                      <ChevronLeft className="mr-1 size-4" />
                      {t('previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1 || isPending}
                      onClick={() => fetchLogs(page + 1)}
                    >
                      {t('nextPage')}
                      <ChevronRight className="ml-1 size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
