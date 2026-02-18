'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  updateOrganization,
  checkSlugAvailability,
  assignOrganizationPlan,
  removeOrganizationPlan,
} from '../../../actions'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  settings: unknown
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired'
  defaultLocale: 'de' | 'en' | null
  internalNotes: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  productName?: string | null
}

interface AvailableProduct {
  id: string
  name: string
}

export function OrgEditClient({
  organization,
  currentProductId,
  availableProducts,
}: {
  organization: Organization
  currentProductId: string | null
  availableProducts: AvailableProduct[]
}) {
  const t = useTranslations('admin.orgs')
  const tEdit = useTranslations('admin.orgs.edit')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(organization.name)
  const [slug, setSlug] = useState(organization.slug)
  const [subscriptionStatus, setSubscriptionStatus] = useState(organization.subscriptionStatus)
  const [defaultLocale, setDefaultLocale] = useState<'de' | 'en' | ''>(
    organization.defaultLocale || ''
  )
  const [internalNotes, setInternalNotes] = useState(organization.internalNotes || '')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(currentProductId)
  const [savingPlan, setSavingPlan] = useState(false)

  // Slug validation
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'invalid'>('idle')
  const [slugTimer, setSlugTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const appDomain = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3001')
    : 'localhost:3001'

  const validateSlug = useCallback(
    async (value: string) => {
      if (value === organization.slug) {
        setSlugStatus('idle')
        return
      }

      const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
      if (!slugRegex.test(value) || value.length < 2) {
        setSlugStatus('invalid')
        return
      }

      setSlugStatus('checking')
      const result = await checkSlugAvailability(value, organization.id)
      if (result.reserved) {
        setSlugStatus('reserved')
      } else if (result.available) {
        setSlugStatus('available')
      } else {
        setSlugStatus('taken')
      }
    },
    [organization.slug, organization.id]
  )

  useEffect(() => {
    if (slugTimer) clearTimeout(slugTimer)
    if (slug === organization.slug) {
      setSlugStatus('idle')
      return
    }
    const timer = setTimeout(() => validateSlug(slug), 500)
    setSlugTimer(timer)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const showStatusWarning =
    subscriptionStatus !== organization.subscriptionStatus &&
    (subscriptionStatus === 'cancelled' || subscriptionStatus === 'expired')

  async function handlePlanChange(productId: string | null) {
    setSavingPlan(true)
    try {
      let result: { success: boolean; error?: string }
      if (productId) {
        result = await assignOrganizationPlan(organization.id, productId)
      } else {
        result = await removeOrganizationPlan(organization.id)
      }

      if (result.success) {
        setSelectedProductId(productId)
        toast.success(
          productId ? tEdit('planAssignSuccess') : tEdit('planRemoveSuccess'),
          { className: 'rounded-full', position: 'top-center' }
        )
      } else {
        toast.error(result.error || t('error'), {
          className: 'rounded-full',
          position: 'top-center',
        })
      }
    } finally {
      setSavingPlan(false)
    }
  }

  async function handleSave() {
    if (slugStatus === 'taken' || slugStatus === 'reserved' || slugStatus === 'invalid') {
      toast.error(tEdit('slugUnavailable'), {
        className: 'rounded-full',
        position: 'top-center',
      })
      return
    }

    setSaving(true)
    try {
      const result = await updateOrganization({
        id: organization.id,
        name,
        slug,
        subscriptionStatus,
        defaultLocale: defaultLocale || null,
        internalNotes: internalNotes || null,
      })

      if (result.success) {
        toast.success(tEdit('saved'), {
          className: 'rounded-full',
          position: 'top-center',
        })
        router.push(`/${locale}/admin/organizations/${organization.id}`)
        router.refresh()
      } else {
        toast.error(result.error || t('error'), {
          className: 'rounded-full',
          position: 'top-center',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/organizations/${organization.id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {tEdit('title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {organization.name}
          </p>
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
            <CardTitle>{tEdit('basicData')}</CardTitle>
            <CardDescription>{tEdit('basicDataDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t('slug')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="acme"
                  className="font-mono"
                />
                {slugStatus === 'checking' && (
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                )}
                {slugStatus === 'available' && (
                  <CheckCircle2 className="size-4 text-green-500" />
                )}
                {(slugStatus === 'taken' || slugStatus === 'reserved') && (
                  <XCircle className="size-4 text-red-500" />
                )}
                {slugStatus === 'invalid' && (
                  <XCircle className="text-muted-foreground size-4" />
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {tEdit('subdomainPreview')}: <span className="font-mono font-medium">{slug}.{appDomain}</span>
              </p>
              {slugStatus === 'taken' && (
                <p className="text-xs text-red-500">{tEdit('slugTaken')}</p>
              )}
              {slugStatus === 'reserved' && (
                <p className="text-xs text-red-500">{tEdit('slugReserved')}</p>
              )}
              {slugStatus === 'invalid' && slug !== organization.slug && (
                <p className="text-muted-foreground text-xs">{tEdit('slugInvalid')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status & Plan */}
        <Card>
          <CardHeader>
            <CardTitle>{tEdit('statusAndPlan')}</CardTitle>
            <CardDescription>{tEdit('statusAndPlanDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('plan')}</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedProductId || 'none'}
                  onValueChange={(v) => handlePlanChange(v === 'none' ? null : v)}
                  disabled={savingPlan}
                >
                  <SelectTrigger className="flex-1">
                    {savingPlan ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('noPlan')}</SelectItem>
                    {availableProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('tierStatus')}</Label>
              <Select
                value={subscriptionStatus}
                onValueChange={(v) => setSubscriptionStatus(v as typeof subscriptionStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">
                    <Badge variant="outline" className="font-normal">{t('trial')}</Badge>
                  </SelectItem>
                  <SelectItem value="active">
                    <Badge variant="secondary" className="font-normal">{t('active')}</Badge>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <Badge variant="destructive" className="font-normal">{t('cancelled')}</Badge>
                  </SelectItem>
                  <SelectItem value="expired">
                    <Badge variant="outline" className="font-normal">{t('expired')}</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
              {showStatusWarning && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 p-2 dark:bg-red-950/30">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  <p className="text-xs text-red-700 dark:text-red-400">
                    {tEdit('statusChangeWarning')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{tEdit('settings')}</CardTitle>
            <CardDescription>{tEdit('settingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{tEdit('defaultLanguage')}</Label>
              <Select
                value={defaultLocale || 'inherit'}
                onValueChange={(v) => setDefaultLocale(v === 'inherit' ? '' : v as 'de' | 'en')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">{tEdit('inheritPlatform')}</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{tEdit('internalNotes')}</CardTitle>
            <CardDescription>{tEdit('internalNotesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder={tEdit('internalNotesPlaceholder')}
              rows={6}
              maxLength={5000}
            />
            <p className="text-muted-foreground text-right text-xs">
              {internalNotes.length} / 5000
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Save Button */}
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
