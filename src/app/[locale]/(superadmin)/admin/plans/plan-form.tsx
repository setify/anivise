'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { createProduct, updateProduct } from '../actions'

interface PlanData {
  id?: string
  name: string
  slug: string
  description: string | null
  isDefault: boolean
  sortOrder: number
  maxOrgAdmins: number | null
  maxManagers: number | null
  maxMembers: number | null
  maxAnalysesPerMonth: number | null
  maxForms: number | null
  maxFormSubmissionsPerMonth: number | null
  maxStorageMb: number | null
}

function toNumOrNull(value: string): number | null {
  if (!value.trim()) return null
  const n = parseInt(value, 10)
  return isNaN(n) ? null : n
}

export function PlanForm({ plan }: { plan?: PlanData }) {
  const t = useTranslations('admin.plans')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const isEditing = !!plan?.id

  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(plan?.name ?? '')
  const [slug, setSlug] = useState(plan?.slug ?? '')
  const [description, setDescription] = useState(plan?.description ?? '')
  const [isDefault, setIsDefault] = useState(plan?.isDefault ?? false)
  const [sortOrder, setSortOrder] = useState(String(plan?.sortOrder ?? 0))

  // Seat limits
  const [maxOrgAdmins, setMaxOrgAdmins] = useState(plan?.maxOrgAdmins?.toString() ?? '')
  const [maxManagers, setMaxManagers] = useState(plan?.maxManagers?.toString() ?? '')
  const [maxMembers, setMaxMembers] = useState(plan?.maxMembers?.toString() ?? '')

  // Feature limits
  const [maxAnalysesPerMonth, setMaxAnalysesPerMonth] = useState(plan?.maxAnalysesPerMonth?.toString() ?? '')
  const [maxForms, setMaxForms] = useState(plan?.maxForms?.toString() ?? '')
  const [maxFormSubmissionsPerMonth, setMaxFormSubmissionsPerMonth] = useState(plan?.maxFormSubmissionsPerMonth?.toString() ?? '')
  const [maxStorageMb, setMaxStorageMb] = useState(plan?.maxStorageMb?.toString() ?? '')

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error(t('nameRequired'), { className: 'rounded-full' })
      return
    }
    if (!slug.trim()) {
      toast.error(t('slugRequired'), { className: 'rounded-full' })
      return
    }

    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        isDefault,
        sortOrder: parseInt(sortOrder, 10) || 0,
        maxOrgAdmins: toNumOrNull(maxOrgAdmins),
        maxManagers: toNumOrNull(maxManagers),
        maxMembers: toNumOrNull(maxMembers),
        maxAnalysesPerMonth: toNumOrNull(maxAnalysesPerMonth),
        maxForms: toNumOrNull(maxForms),
        maxFormSubmissionsPerMonth: toNumOrNull(maxFormSubmissionsPerMonth),
        maxStorageMb: toNumOrNull(maxStorageMb),
      }

      const result = isEditing
        ? await updateProduct(plan!.id!, data)
        : await createProduct(data)

      if (result.success) {
        toast.success(isEditing ? t('saved') : t('created'), { className: 'rounded-full' })
        if (isEditing) {
          router.push(`/${locale}/admin/plans/${plan!.id}`)
        } else {
          router.push(`/${locale}/admin/plans`)
        }
        router.refresh()
      } else {
        toast.error(result.error || t('error'), { className: 'rounded-full' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={isEditing ? `/${locale}/admin/plans/${plan!.id}` : `/${locale}/admin/plans`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? t('editPlan') : t('createPlan')}
          </h1>
          {isEditing && (
            <p className="text-muted-foreground text-sm">{plan!.name}</p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {tCommon('save')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Data */}
        <Card>
          <CardHeader>
            <CardTitle>{t('basicData')}</CardTitle>
            <CardDescription>{t('basicDataDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!isEditing) setSlug(autoSlug(e.target.value))
                }}
                placeholder="Professional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t('slug')}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="professional"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('planDescription')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">{t('sortOrder')}</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
              <Label>{t('isDefault')}</Label>
            </div>
          </CardContent>
        </Card>

        {/* Seat Limits */}
        <Card>
          <CardHeader>
            <CardTitle>{t('seatLimits')}</CardTitle>
            <CardDescription>{t('seatLimitsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxOrgAdmins">{t('maxOrgAdmins')}</Label>
              <Input
                id="maxOrgAdmins"
                type="number"
                min="0"
                value={maxOrgAdmins}
                onChange={(e) => setMaxOrgAdmins(e.target.value)}
                placeholder={t('unlimited')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxManagers">{t('maxManagers')}</Label>
              <Input
                id="maxManagers"
                type="number"
                min="0"
                value={maxManagers}
                onChange={(e) => setMaxManagers(e.target.value)}
                placeholder={t('unlimited')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMembers">{t('maxMembers')}</Label>
              <Input
                id="maxMembers"
                type="number"
                min="0"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                placeholder={t('unlimited')}
              />
            </div>

            <p className="text-muted-foreground text-xs">{t('unlimitedHint')}</p>
          </CardContent>
        </Card>

        {/* Feature Limits */}
        <Card>
          <CardHeader>
            <CardTitle>{t('featureLimits')}</CardTitle>
            <CardDescription>{t('featureLimitsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxAnalysesPerMonth">{t('maxAnalysesPerMonth')}</Label>
              <Input
                id="maxAnalysesPerMonth"
                type="number"
                min="0"
                value={maxAnalysesPerMonth}
                onChange={(e) => setMaxAnalysesPerMonth(e.target.value)}
                placeholder={t('unlimited')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxForms">{t('maxForms')}</Label>
              <Input
                id="maxForms"
                type="number"
                min="0"
                value={maxForms}
                onChange={(e) => setMaxForms(e.target.value)}
                placeholder={t('unlimited')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFormSubmissionsPerMonth">{t('maxFormSubmissionsPerMonth')}</Label>
              <Input
                id="maxFormSubmissionsPerMonth"
                type="number"
                min="0"
                value={maxFormSubmissionsPerMonth}
                onChange={(e) => setMaxFormSubmissionsPerMonth(e.target.value)}
                placeholder={t('unlimited')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <CardTitle>{t('storageLimits')}</CardTitle>
            <CardDescription>{t('storageLimitsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxStorageMb">{t('maxStorageMb')}</Label>
              <Input
                id="maxStorageMb"
                type="number"
                min="0"
                value={maxStorageMb}
                onChange={(e) => setMaxStorageMb(e.target.value)}
                placeholder={t('unlimited')}
              />
              <p className="text-muted-foreground text-xs">{t('storageMbHint')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {tCommon('save')}
        </Button>
      </div>
    </div>
  )
}
