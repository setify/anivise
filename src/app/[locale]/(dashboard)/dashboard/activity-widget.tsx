'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecentActivityRow } from '../settings/activity-log/actions'

const ACTION_BADGE_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  shared: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  status_changed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(ACTION_BADGE_COLORS)) {
    if (action.includes(key)) return color
  }
  return 'bg-gray-100 text-gray-800'
}

function formatAction(action: string): string {
  return action.replace(/\./g, ' → ').replace(/_/g, ' ')
}

interface ActivityWidgetProps {
  activities: RecentActivityRow[]
}

export function ActivityWidget({ activities }: ActivityWidgetProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  function timeAgo(date: Date) {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return locale === 'de' ? 'Gerade eben' : 'Just now'
    if (minutes < 60)
      return locale === 'de' ? `vor ${minutes} Min.` : `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24)
      return locale === 'de' ? `vor ${hours} Std.` : `${hours}h ago`
    const days = Math.floor(hours / 24)
    return locale === 'de' ? `vor ${days} Tag(en)` : `${days}d ago`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('recentActivity')}</CardTitle>
        <Link
          href={`/${locale}/settings/activity-log`}
          className="text-primary text-xs hover:underline"
        >
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <Activity className="text-muted-foreground mb-2 size-6" />
            <p className="text-muted-foreground text-sm">{t('noActivity')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {act.actorName}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] ${getActionColor(act.action)}`}
                    >
                      {formatAction(act.action)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {act.entityType}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {timeAgo(act.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
