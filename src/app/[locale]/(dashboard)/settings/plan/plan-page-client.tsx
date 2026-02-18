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
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  CreditCard,
  Info,
  Mail,
} from 'lucide-react'
import { PlanUsageBar } from '@/components/org/plan-usage-bar'
import type { PlanOverview } from './actions'

function formatMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

export function PlanPageClient({
  overview,
  upgradeEmail,
}: {
  overview: PlanOverview | null
  upgradeEmail: string | null
}) {
  const t = useTranslations('org.settings.plan')

  if (!overview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
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

      {/* Plan Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <CreditCard className="text-primary size-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {overview.planName ?? t('noPlanAssigned')}
                {overview.planName && (
                  <Badge variant="secondary" className="text-xs">
                    {t('active')}
                  </Badge>
                )}
              </CardTitle>
              {overview.planDescription && (
                <CardDescription className="mt-0.5">
                  {overview.planDescription}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Cards – 2 columns */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Team Seats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('seats')}</CardTitle>
            <CardDescription>{t('seatsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <PlanUsageBar
              label={t('orgAdmins')}
              current={overview.usage.orgAdmins}
              limit={overview.limits.maxOrgAdmins}
              unit={t('unitSeats')}
            />
            <PlanUsageBar
              label={t('managers')}
              current={overview.usage.managers}
              limit={overview.limits.maxManagers}
              unit={t('unitSeats')}
            />
            <PlanUsageBar
              label={t('employees')}
              current={overview.usage.members}
              limit={overview.limits.maxMembers}
              unit={t('unitSeats')}
            />
          </CardContent>
        </Card>

        {/* Feature Limits */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('features')}</CardTitle>
            <CardDescription>{t('featuresDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <PlanUsageBar
              label={t('analysesThisMonth')}
              current={overview.usage.analysesThisMonth}
              limit={overview.limits.maxAnalysesPerMonth}
              unit={t('unitUsed')}
            />
            <PlanUsageBar
              label={t('activeForms')}
              current={overview.usage.activeForms}
              limit={overview.limits.maxForms}
              unit={t('unitActive')}
            />
            <PlanUsageBar
              label={t('submissionsThisMonth')}
              current={overview.usage.formSubmissionsThisMonth}
              limit={overview.limits.maxFormSubmissionsPerMonth}
              unit={t('unitUsed')}
            />
            <PlanUsageBar
              label={t('storage')}
              current={0}
              limit={overview.limits.maxStorageMb}
              unit={t('unitUsed')}
              formatValue={formatMb}
            />
          </CardContent>
        </Card>
      </div>

      {/* Info + Contact */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>{t('monthlyResetInfo')}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">{t('needMoreCapacity')}</p>
          {upgradeEmail ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${upgradeEmail}`}>
                <Mail className="mr-2 size-4" />
                {t('contactUs')}
              </a>
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">{t('contactAdmin')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
