'use client'

import { type ElementType } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, MoreHorizontal, Pencil, Archive, RotateCcw, Star, FileText, Key, Palette, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { archiveProduct, reactivateProduct } from '../actions'

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
  allowForms: boolean
  allowApiAccess: boolean
  allowCustomBranding: boolean
  allowEmailTemplates: boolean
  createdAt: Date
}

function formatLimit(value: number | null): string {
  return value === null ? '∞' : String(value)
}

function FeatureIcon({
  enabled,
  icon: Icon,
  label,
}: {
  enabled: boolean
  icon: ElementType
  label: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center justify-center size-6 rounded ${
            enabled
              ? 'text-green-600 dark:text-green-400'
              : 'text-muted-foreground/40'
          }`}
        >
          <Icon className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span>{label}</span>
      </TooltipContent>
    </Tooltip>
  )
}

export function PlansPageClient({
  plans,
  isSuperadmin,
}: {
  plans: Plan[]
  isSuperadmin: boolean
}) {
  const t = useTranslations('admin.plans')
  const locale = useLocale()
  const router = useRouter()

  async function handleArchive(id: string) {
    const result = await archiveProduct(id)
    if (result.success) {
      toast.success(t('archived'), { className: 'rounded-full' })
      router.refresh()
    } else {
      toast.error(result.error || t('error'), { className: 'rounded-full' })
    }
  }

  async function handleReactivate(id: string) {
    const result = await reactivateProduct(id)
    if (result.success) {
      toast.success(t('reactivated'), { className: 'rounded-full' })
      router.refresh()
    } else {
      toast.error(result.error || t('error'), { className: 'rounded-full' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {isSuperadmin && (
          <Button asChild>
            <Link href={`/${locale}/admin/plans/new`}>
              <Plus className="mr-2 size-4" />
              {t('createPlan')}
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('allPlans')}</CardTitle>
          <CardDescription>{t('allPlansDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noPlans')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('slug')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-center">{t('seats')}</TableHead>
                  <TableHead className="text-center">{t('analyses')}</TableHead>
                  <TableHead className="text-center">{t('forms')}</TableHead>
                  <TableHead className="text-center">{t('storage')}</TableHead>
                  <TableHead className="text-center">{t('features')}</TableHead>
                  {isSuperadmin && (
                    <TableHead className="w-[60px]" />
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id} className={plan.status === 'archived' ? 'opacity-50' : undefined}>
                    <TableCell>
                      <Link
                        href={`/${locale}/admin/plans/${plan.id}`}
                        className="font-medium hover:underline"
                      >
                        {plan.name}
                      </Link>
                      {plan.isDefault && (
                        <Badge variant="outline" className="ml-2 gap-1">
                          <Star className="size-3" />
                          {t('default')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {plan.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                        {t(plan.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatLimit(plan.maxOrgAdmins)} / {formatLimit(plan.maxManagers)} / {formatLimit(plan.maxMembers)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatLimit(plan.maxAnalysesPerMonth)}/mo
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatLimit(plan.maxForms)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatLimit(plan.maxStorageMb)} MB
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider delayDuration={200}>
                        <div className="flex items-center justify-center gap-0.5">
                          <FeatureIcon enabled={plan.allowForms} icon={FileText} label={t('allowForms')} />
                          <FeatureIcon enabled={plan.allowApiAccess} icon={Key} label={t('allowApiAccess')} />
                          <FeatureIcon enabled={plan.allowCustomBranding} icon={Palette} label={t('allowCustomBranding')} />
                          <FeatureIcon enabled={plan.allowEmailTemplates} icon={Mail} label={t('allowEmailTemplates')} />
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    {isSuperadmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/admin/plans/${plan.id}/edit`}>
                                <Pencil className="mr-2 size-4" />
                                {t('edit')}
                              </Link>
                            </DropdownMenuItem>
                            {plan.status === 'active' ? (
                              <DropdownMenuItem onClick={() => handleArchive(plan.id)}>
                                <Archive className="mr-2 size-4" />
                                {t('archive')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleReactivate(plan.id)}>
                                <RotateCcw className="mr-2 size-4" />
                                {t('reactivate')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
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
