'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import { getActivityLog } from './actions'
import type { ActivityLogRow } from './actions'

const PAGE_SIZE = 50

const ACTION_CATEGORIES = [
  { value: '__all__', labelKey: 'all' },
  { value: 'analysis.', labelKey: 'analyses' },
  { value: 'employee.', labelKey: 'employees' },
  { value: 'guide.', labelKey: 'guides' },
  { value: 'guide_category.', labelKey: 'guideCategories' },
  { value: 'org_member.', labelKey: 'members' },
  { value: 'department.', labelKey: 'departments' },
  { value: 'location.', labelKey: 'locations' },
  { value: 'settings.', labelKey: 'settings' },
  { value: 'invitation.', labelKey: 'invitations' },
]

const ACTION_BADGE_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  shared: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  status_changed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

function getActionBadgeColor(action: string): string {
  for (const [key, color] of Object.entries(ACTION_BADGE_COLORS)) {
    if (action.includes(key)) return color
  }
  return 'bg-gray-100 text-gray-800'
}

interface ActivityLogClientProps {
  initialLogs: ActivityLogRow[]
  initialTotal: number
}

export function ActivityLogClient({
  initialLogs,
  initialTotal,
}: ActivityLogClientProps) {
  const t = useTranslations('org.settings.activityLog')
  const locale = useLocale()
  const [logs, setLogs] = useState(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(0)
  const [actionFilter, setActionFilter] = useState('__all__')
  const [loading, setLoading] = useState(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  async function loadPage(newPage: number, newActionFilter?: string) {
    setLoading(true)
    const filter = newActionFilter ?? actionFilter
    const result = await getActivityLog({
      limit: PAGE_SIZE,
      offset: newPage * PAGE_SIZE,
      actionFilter: filter,
    })
    setLogs(result.logs)
    setTotal(result.total)
    setPage(newPage)
    setLoading(false)
  }

  function handleFilterChange(value: string) {
    setActionFilter(value)
    loadPage(0, value)
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function formatAction(action: string): string {
    return action.replace(/\./g, ' → ').replace(/_/g, ' ')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={actionFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {t(`categories.${cat.labelKey}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-sm">
          {t('totalEntries', { count: total })}
        </span>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Activity className="text-muted-foreground mb-3 size-10" />
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.date')}</TableHead>
                  <TableHead>{t('table.user')}</TableHead>
                  <TableHead>{t('table.action')}</TableHead>
                  <TableHead>{t('table.entity')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {log.actorName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getActionBadgeColor(log.action)}`}
                      >
                        {formatAction(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {log.entityType}
                        {log.entityId && (
                          <span className="ml-1 font-mono text-xs opacity-50">
                            {log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {t('page', { current: page + 1, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPage(page - 1)}
              disabled={page === 0 || loading}
            >
              <ChevronLeft className="mr-1 size-3.5" />
              {t('prev')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPage(page + 1)}
              disabled={page >= totalPages - 1 || loading}
            >
              {t('next')}
              <ChevronRight className="ml-1 size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
