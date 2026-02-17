'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Pencil, Star, Users, BarChart3, FileText, HardDrive } from 'lucide-react'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  status: 'active' | 'archived'
  isDefault: boolean
  sortOrder: number
  maxOrgAdmins: number | null
  maxManagers: number | null
  maxMembers: number | null
  maxAnalysesPerMonth: number | null
  maxForms: number | null
  maxFormSubmissionsPerMonth: number | null
  maxStorageMb: number | null
  createdAt: Date
  updatedAt: Date
}

interface AssignedOrg {
  organizationId: string
  orgName: string
  orgSlug: string
  assignedAt: Date
}

function LimitValue({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">
        {value === null ? '∞' : value}
      </span>
    </div>
  )
}

export function PlanDetailClient({
  plan,
  assignedOrgs,
  isSuperadmin,
}: {
  plan: Plan
  assignedOrgs: AssignedOrg[]
  isSuperadmin: boolean
}) {
  const t = useTranslations('admin.plans')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/plans`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
            {plan.isDefault && (
              <Badge variant="outline" className="gap-1">
                <Star className="size-3" />
                {t('default')}
              </Badge>
            )}
            <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
              {t(plan.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm">{plan.slug}</p>
        </div>
        {isSuperadmin && (
          <Button variant="outline" asChild>
            <Link href={`/${locale}/admin/plans/${plan.id}/edit`}>
              <Pencil className="mr-2 size-4" />
              {tCommon('edit')}
            </Link>
          </Button>
        )}
      </div>

      {plan.description && (
        <p className="text-muted-foreground">{plan.description}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4" />
              {t('seatLimits')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <LimitValue value={plan.maxOrgAdmins} label={t('maxOrgAdmins')} />
            <LimitValue value={plan.maxManagers} label={t('maxManagers')} />
            <LimitValue value={plan.maxMembers} label={t('maxMembers')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="size-4" />
              {t('analysisLimits')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <LimitValue value={plan.maxAnalysesPerMonth} label={t('perMonth')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4" />
              {t('formLimits')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <LimitValue value={plan.maxForms} label={t('maxForms')} />
            <LimitValue value={plan.maxFormSubmissionsPerMonth} label={t('submissionsPerMonth')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <HardDrive className="size-4" />
              {t('storageLimits')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <LimitValue value={plan.maxStorageMb} label="MB" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('assignedOrgs')} ({assignedOrgs.length})
          </CardTitle>
          <CardDescription>{t('assignedOrgsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedOrgs.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noAssignedOrgs')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orgName')}</TableHead>
                  <TableHead>{t('orgSlug')}</TableHead>
                  <TableHead>{t('assignedAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedOrgs.map((org) => (
                  <TableRow key={org.organizationId}>
                    <TableCell>
                      <Link
                        href={`/${locale}/admin/organizations/${org.organizationId}`}
                        className="font-medium hover:underline"
                      >
                        {org.orgName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {org.orgSlug}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(org.assignedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
