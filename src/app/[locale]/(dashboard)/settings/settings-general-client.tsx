'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Lock, Pencil } from 'lucide-react'
import { updateOrgGeneralSettings, type OrgGeneralData } from './actions'
import { Combobox } from '@/components/ui/combobox'

const INDUSTRIES = [
  'Technologie',
  'Beratung / Consulting',
  'Finanzdienstleistungen',
  'Gesundheitswesen',
  'Maschinenbau / Industrie',
  'Handel / E-Commerce',
  'Medien / Kommunikation',
  'Bildung',
  'Öffentlicher Dienst',
  'Energie',
  'Immobilien',
  'Automotive',
  'Pharma / Chemie',
  'Sonstiges',
]

const COUNTRIES = [
  { value: 'DE', label: 'Deutschland' },
  { value: 'AT', label: 'Österreich' },
  { value: 'CH', label: 'Schweiz' },
  { value: 'FR', label: 'Frankreich' },
  { value: 'NL', label: 'Niederlande' },
  { value: 'BE', label: 'Belgien' },
  { value: 'LU', label: 'Luxemburg' },
  { value: 'IT', label: 'Italien' },
  { value: 'ES', label: 'Spanien' },
  { value: 'PL', label: 'Polen' },
  { value: 'CZ', label: 'Tschechien' },
  { value: 'SE', label: 'Schweden' },
  { value: 'DK', label: 'Dänemark' },
  { value: 'FI', label: 'Finnland' },
  { value: 'NO', label: 'Norwegen' },
  { value: 'PT', label: 'Portugal' },
  { value: 'HU', label: 'Ungarn' },
  { value: 'RO', label: 'Rumänien' },
  { value: 'GB', label: 'Vereinigtes Königreich' },
]

function ValueDisplay({ value, fallback }: { value: string | null | undefined; fallback?: string }) {
  const t = useTranslations('org.settings.general')
  if (!value) {
    return <span className="text-muted-foreground">{fallback ?? t('notSpecified')}</span>
  }
  return <span>{value}</span>
}

interface Props {
  data: OrgGeneralData
}

export function SettingsGeneralClient({ data }: Props) {
  const t = useTranslations('org.settings.general')
  const tc = useTranslations('common')
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Local form state (controlled)
  const [form, setForm] = useState({
    name: data.name,
    street: data.street ?? '',
    zipCode: data.zipCode ?? '',
    city: data.city ?? '',
    country: data.country ?? 'DE',
    phone: data.phone ?? '',
    email: data.email ?? '',
    website: data.website ?? '',
    taxId: data.taxId ?? '',
    industry: data.industry ?? '',
  })

  function handleChange(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleCancel() {
    setForm({
      name: data.name,
      street: data.street ?? '',
      zipCode: data.zipCode ?? '',
      city: data.city ?? '',
      country: data.country ?? 'DE',
      phone: data.phone ?? '',
      email: data.email ?? '',
      website: data.website ?? '',
      taxId: data.taxId ?? '',
      industry: data.industry ?? '',
    })
    setEditing(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    // Inject combobox/select values not captured by name
    fd.set('country', form.country)
    fd.set('industry', form.industry)

    startTransition(async () => {
      const result = await updateOrgGeneralSettings(fd)
      if (result.success) {
        toast.success(t('saveSuccess'))
        setEditing(false)
      } else {
        toast.error(result.error ?? tc('error'))
      }
    })
  }

  const addressParts = [data.street, [data.zipCode, data.city].filter(Boolean).join(' '), data.country]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 size-3.5" />
            {tc('edit')}
          </Button>
        )}
      </div>

      {/* ── VIEW MODE ── */}
      {!editing && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Basic */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('basicData')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('companyName')}</span>
                <ValueDisplay value={data.name} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  {t('subdomain')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Lock className="size-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="max-w-xs">{t('subdomainLockedHint')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className="font-mono text-xs text-muted-foreground">{data.slug}.anivise.com</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('contactInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('address')}</span>
                <ValueDisplay value={addressParts || null} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('phone')}</span>
                <ValueDisplay value={data.phone} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('emailField')}</span>
                <ValueDisplay value={data.email} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('website')}</span>
                <ValueDisplay value={data.website} />
              </div>
            </CardContent>
          </Card>

          {/* Business */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('businessData')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('taxId')}</span>
                <ValueDisplay value={data.taxId} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('industry')}</span>
                <ValueDisplay value={data.industry} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {editing && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Basic */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('basicData')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t('companyName')} *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('subdomain')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${data.slug}.anivise.com`}
                      readOnly
                      disabled
                      className="font-mono text-sm text-muted-foreground"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Lock className="size-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="max-w-xs">{t('subdomainLockedHint')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('address')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="street">{t('street')}</Label>
                  <Input
                    id="street"
                    name="street"
                    placeholder="Musterstraße 42"
                    value={form.street}
                    onChange={(e) => handleChange('street', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="zipCode">{t('zipCode')}</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      placeholder="10115"
                      value={form.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">{t('city')}</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Berlin"
                      value={form.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('country')}</Label>
                  <Select
                    value={form.country}
                    onValueChange={(v) => handleChange('country', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('contactInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+49 30 12345678"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('emailField')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="info@firma.de"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">{t('website')}</Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="www.firma.de"
                    value={form.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Business */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('businessData')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="taxId">{t('taxId')}</Label>
                  <Input
                    id="taxId"
                    name="taxId"
                    placeholder="DE123456789"
                    value={form.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('industry')}</Label>
                  <Combobox
                    value={form.industry}
                    onValueChange={(v) => handleChange('industry', v)}
                    options={INDUSTRIES.map((i) => ({ label: i, value: i }))}
                    placeholder={t('industryPlaceholder')}
                    allowCustomValue
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? tc('saving') : tc('save')}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              {tc('cancel')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
