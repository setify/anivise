'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { updateOrganization, checkSlugAvailability } from '../../../actions'
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
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  settings: unknown
  subscriptionTier: 'individual' | 'team' | 'enterprise'
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired'
  defaultLocale: 'de' | 'en' | null
  maxMembers: number | null
  maxAnalysesPerMonth: number | null
  internalNotes: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export function OrgEditClient({ organization }: { organization: Organization }) {
  const t = useTranslations('admin.orgs')
  const tEdit = useTranslations('admin.orgs.edit')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(organization.name)
  const [slug, setSlug] = useState(organization.slug)
  const [subscriptionTier, setSubscriptionTier] = useState(organization.subscriptionTier)
  const [subscriptionStatus, setSubscriptionStatus] = useState(organization.subscriptionStatus)
  const [defaultLocale, setDefaultLocale] = useState<'de' | 'en' | ''>(
    organization.defaultLocale || ''
  )
  const [maxMembers, setMaxMembers] = useState(
    organization.maxMembers?.toString() || ''
  )
  const [maxAnalysesPerMonth, setMaxAnalysesPerMonth] = useState(
    organization.maxAnalysesPerMonth?.toString() || ''
  )
  const [internalNotes, setInternalNotes] = useState(organization.internalNotes || '')

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

  const showTierWarning =
    subscriptionTier !== organization.subscriptionTier
  const showStatusWarning =
    subscriptionStatus !== organization.subscriptionStatus &&
    (subscriptionStatus === 'cancelled' || subscriptionStatus === 'expired')

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
        subscriptionTier,
        subscriptionStatus,
        defaultLocale: defaultLocale || null,
        maxMembers: maxMembers ? parseInt(maxMembers, 10) : null,
        maxAnalysesPerMonth: maxAnalysesPerMonth ? parseInt(maxAnalysesPerMonth, 10) : null,
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

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>{tEdit('subscription')}</CardTitle>
            <CardDescription>{tEdit('subscriptionDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('tier')}</Label>
              <Select
                value={subscriptionTier}
                onValueChange={(v) => setSubscriptionTier(v as typeof subscriptionTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">{t('individual')}</SelectItem>
                  <SelectItem value="team">{t('teamTier')}</SelectItem>
                  <SelectItem value="enterprise">{t('enterprise')}</SelectItem>
                </SelectContent>
              </Select>
              {showTierWarning && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 p-2 dark:bg-amber-950/30">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {tEdit('tierChangeWarning')}
                  </p>
                </div>
              )}
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

        {/* Limits & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{tEdit('limitsAndSettings')}</CardTitle>
            <CardDescription>{tEdit('limitsDescription')}</CardDescription>
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

            <div className="space-y-2">
              <Label htmlFor="maxMembers">{tEdit('maxMembers')}</Label>
              <Input
                id="maxMembers"
                type="number"
                min="1"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                placeholder={tEdit('unlimited')}
              />
              <p className="text-muted-foreground text-xs">
                {tEdit('maxMembersHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAnalyses">{tEdit('maxAnalysesPerMonth')}</Label>
              <Input
                id="maxAnalyses"
                type="number"
                min="1"
                value={maxAnalysesPerMonth}
                onChange={(e) => setMaxAnalysesPerMonth(e.target.value)}
                placeholder={tEdit('unlimited')}
              />
              <p className="text-muted-foreground text-xs">
                {tEdit('maxAnalysesHelp')}
              </p>
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
