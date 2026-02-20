'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CreditCard, ArrowRight, AlertTriangle } from 'lucide-react'
import type { PlanOverview } from '../settings/plan/actions'

function MiniUsageBar({
  label,
  current,
  limit,
}: {
  label: string
  current: number
  limit: number | null
}) {
  const isUnlimited = limit === null
  const percentage = isUnlimited ? 0 : limit === 0 ? 100 : Math.min((current / limit) * 100, 100)
  const isWarning = !isUnlimited && percentage >= 80

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current} / {isUnlimited ? '∞' : limit}
          {isWarning && <AlertTriangle className="ml-1 inline size-3 text-yellow-500" />}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={`h-1.5 ${
            percentage >= 100
              ? '[&>div]:bg-destructive'
              : isWarning
                ? '[&>div]:bg-yellow-500'
                : ''
          }`}
        />
      )}
    </div>
  )
}

export function PlanWidget({ overview }: { overview: PlanOverview }) {
  const t = useTranslations('dashboard.planWidget')
  const locale = useLocale()

  const totalSeats =
    (overview.usage.orgAdmins) +
    (overview.usage.managers) +
    (overview.usage.members)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4" />
          {t('title')}
        </CardTitle>
        <Badge variant="secondary">{overview.planName || t('noPlan')}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <MiniUsageBar
          label={t('seats')}
          current={totalSeats}
          limit={
            overview.limits.maxOrgAdmins !== null &&
            overview.limits.maxManagers !== null &&
            overview.limits.maxMembers !== null
              ? overview.limits.maxOrgAdmins + overview.limits.maxManagers + overview.limits.maxMembers
              : null
          }
        />
        <MiniUsageBar
          label={t('analyses')}
          current={overview.usage.analysesThisMonth}
          limit={overview.limits.maxAnalysesPerMonth}
        />
        <MiniUsageBar
          label={t('forms')}
          current={overview.usage.activeForms}
          limit={overview.limits.maxForms}
        />
        <MiniUsageBar
          label={t('storage')}
          current={overview.usage.storageMb}
          limit={overview.limits.maxStorageMb}
        />

        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href={`/${locale}/settings/plan`}>
            {t('viewDetails')}
            <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
