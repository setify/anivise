'use client'

import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  BarChart3,
  FileText,
  HardDrive,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import type { PlanOverview } from './actions'

function UsageBar({
  label,
  current,
  limit,
}: {
  label: string
  current: number
  limit: number | null
}) {
  const t = useTranslations('plan')
  const isUnlimited = limit === null
  const percentage = isUnlimited ? 0 : limit === 0 ? 100 : Math.min((current / limit) * 100, 100)
  const isWarning = !isUnlimited && percentage >= 80
  const isExceeded = !isUnlimited && percentage >= 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current} / {isUnlimited ? '\u221E' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={
            isExceeded
              ? '[&>div]:bg-destructive'
              : isWarning
                ? '[&>div]:bg-yellow-500'
                : ''
          }
        />
      )}
      {isUnlimited && (
        <p className="text-muted-foreground text-xs">{t('unlimited')}</p>
      )}
      {isExceeded && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="size-3" />
          {t('limitReached')}
        </div>
      )}
      {isWarning && !isExceeded && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          {t('limitWarning', { percent: Math.round(percentage) })}
        </p>
      )}
    </div>
  )
}

export function PlanPageClient({
  overview,
}: {
  overview: PlanOverview | null
}) {
  const t = useTranslations('plan')

  if (!overview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <CreditCard className="text-muted-foreground mx-auto mb-3 size-8" />
            <p className="text-muted-foreground">{t('noPlan')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CreditCard className="text-muted-foreground size-5" />
            <div>
              <CardTitle className="flex items-center gap-2">
                {overview.planName || t('noPlanAssigned')}
                {overview.planName && (
                  <Badge variant="secondary">{t('active')}</Badge>
                )}
              </CardTitle>
              {overview.planDescription && (
                <CardDescription className="mt-1">
                  {overview.planDescription}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Seats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              {t('seats')}
            </CardTitle>
            <CardDescription>{t('seatsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar
              label={t('orgAdmins')}
              current={overview.usage.orgAdmins}
              limit={overview.limits.maxOrgAdmins}
            />
            <UsageBar
              label={t('managers')}
              current={overview.usage.managers}
              limit={overview.limits.maxManagers}
            />
            <UsageBar
              label={t('members')}
              current={overview.usage.members}
              limit={overview.limits.maxMembers}
            />
          </CardContent>
        </Card>

        {/* Analyses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              {t('analyses')}
            </CardTitle>
            <CardDescription>{t('analysesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar
              label={t('analysesThisMonth')}
              current={overview.usage.analysesThisMonth}
              limit={overview.limits.maxAnalysesPerMonth}
            />
          </CardContent>
        </Card>

        {/* Forms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              {t('forms')}
            </CardTitle>
            <CardDescription>{t('formsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar
              label={t('activeForms')}
              current={overview.usage.activeForms}
              limit={overview.limits.maxForms}
            />
            <UsageBar
              label={t('submissionsThisMonth')}
              current={overview.usage.formSubmissionsThisMonth}
              limit={overview.limits.maxFormSubmissionsPerMonth}
            />
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="size-4" />
              {t('storage')}
            </CardTitle>
            <CardDescription>{t('storageDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar
              label="MB"
              current={0}
              limit={overview.limits.maxStorageMb}
            />
            <p className="text-muted-foreground text-xs">
              {t('storageNotTracked')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
