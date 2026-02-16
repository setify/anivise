'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Save, X, Plus, Loader2, Mail, ArrowRight, Palette } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updatePlatformSettings } from '../actions'
import type { PlatformSettings } from '@/lib/settings/platform'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface Props {
  settings: Partial<PlatformSettings>
  currentUser: { id: string; platformRole: string | null }
}

export function SettingsPageClient({ settings }: Props) {
  const t = useTranslations('admin.platformSettings')
  const locale = useLocale()

  // General tab state
  const [platformName, setPlatformName] = useState(
    settings['platform.name'] ?? 'Anivise'
  )
  const [defaultLocale, setDefaultLocale] = useState<string>(
    settings['platform.default_locale'] ?? 'de'
  )
  const [defaultOrgTier, setDefaultOrgTier] = useState<string>(
    settings['platform.default_org_tier'] ?? 'team'
  )

  // Invitations tab state
  const [expiryDays, setExpiryDays] = useState(
    settings['invitation.expiry_days'] ?? 7
  )
  const [maxResends, setMaxResends] = useState(
    settings['invitation.max_resends'] ?? 3
  )

  // Orgs tab state
  const [reservedSlugs, setReservedSlugs] = useState<string[]>(
    (settings['org.reserved_slugs'] as string[]) ?? [
      'admin',
      'api',
      'www',
      'app',
      'auth',
      'invite',
      'login',
      'register',
    ]
  )
  const [newSlug, setNewSlug] = useState('')
  const [maxMembersTrial, setMaxMembersTrial] = useState(
    settings['org.max_members_trial'] ?? 5
  )

  // Analysis tab state
  const [maxTranscriptSize, setMaxTranscriptSize] = useState(
    settings['analysis.max_transcript_size_mb'] ?? 10
  )
  const [isPending, startTransition] = useTransition()

  function saveSection(section: string, data: Record<string, unknown>) {
    startTransition(async () => {
      const result = await updatePlatformSettings(section, data)
      if (result.success) {
        toast.success(t('saved'), {
          className: 'rounded-full',
          position: 'top-center',
        })
      } else {
        toast.error(result.error || t('error'), {
          className: 'rounded-full',
          position: 'top-center',
        })
      }
    })
  }

  function addSlug() {
    const slug = newSlug.trim().toLowerCase()
    if (slug && !reservedSlugs.includes(slug)) {
      setReservedSlugs([...reservedSlugs, slug])
      setNewSlug('')
    }
  }

  function removeSlug(slug: string) {
    setReservedSlugs(reservedSlugs.filter((s) => s !== slug))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t('tabs.general')}</TabsTrigger>
          <TabsTrigger value="invitations">{t('tabs.invitations')}</TabsTrigger>
          <TabsTrigger value="organizations">
            {t('tabs.organizations')}
          </TabsTrigger>
          <TabsTrigger value="analysis">{t('tabs.analysis')}</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('general.title')}</CardTitle>
              <CardDescription>{t('general.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">{t('general.platformName')}</Label>
                <Input
                  id="platformName"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLocale">
                  {t('general.defaultLocale')}
                </Label>
                <Select value={defaultLocale} onValueChange={setDefaultLocale}>
                  <SelectTrigger id="defaultLocale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultOrgTier">
                  {t('general.defaultOrgTier')}
                </Label>
                <Select value={defaultOrgTier} onValueChange={setDefaultOrgTier}>
                  <SelectTrigger id="defaultOrgTier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      {t('general.tiers.individual')}
                    </SelectItem>
                    <SelectItem value="team">{t('general.tiers.team')}</SelectItem>
                    <SelectItem value="enterprise">
                      {t('general.tiers.enterprise')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={isPending}
                onClick={() =>
                  saveSection('general', {
                    'platform.name': platformName,
                    'platform.default_locale': defaultLocale,
                    'platform.default_org_tier': defaultOrgTier,
                  })
                }
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {t('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>{t('invitations.title')}</CardTitle>
              <CardDescription>{t('invitations.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDays">
                  {t('invitations.expiryDays')}
                </Label>
                <Input
                  id="expiryDays"
                  type="number"
                  min={1}
                  max={90}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxResends">
                  {t('invitations.maxResends')}
                </Label>
                <Input
                  id="maxResends"
                  type="number"
                  min={1}
                  max={10}
                  value={maxResends}
                  onChange={(e) => setMaxResends(Number(e.target.value))}
                />
              </div>
              <Button
                disabled={isPending}
                onClick={() =>
                  saveSection('invitations', {
                    'invitation.expiry_days': expiryDays,
                    'invitation.max_resends': maxResends,
                  })
                }
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {t('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>{t('organizations.title')}</CardTitle>
              <CardDescription>
                {t('organizations.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('organizations.reservedSlugs')}</Label>
                <div className="flex flex-wrap gap-2">
                  {reservedSlugs.map((slug) => (
                    <Badge
                      key={slug}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {slug}
                      <button
                        type="button"
                        onClick={() => removeSlug(slug)}
                        className="hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('organizations.addSlugPlaceholder')}
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSlug()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addSlug}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMembersTrial">
                  {t('organizations.maxMembersTrial')}
                </Label>
                <Input
                  id="maxMembersTrial"
                  type="number"
                  min={1}
                  max={100}
                  value={maxMembersTrial}
                  onChange={(e) => setMaxMembersTrial(Number(e.target.value))}
                />
              </div>
              <Button
                disabled={isPending}
                onClick={() =>
                  saveSection('organizations', {
                    'org.reserved_slugs': reservedSlugs,
                    'org.max_members_trial': maxMembersTrial,
                  })
                }
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {t('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>{t('analysis.title')}</CardTitle>
              <CardDescription>{t('analysis.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxTranscriptSize">
                  {t('analysis.maxTranscriptSize')}
                </Label>
                <Input
                  id="maxTranscriptSize"
                  type="number"
                  min={1}
                  max={100}
                  value={maxTranscriptSize}
                  onChange={(e) => setMaxTranscriptSize(Number(e.target.value))}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {t('analysis.n8nHint')}
              </p>
              <Button
                disabled={isPending}
                onClick={() =>
                  saveSection('analysis', {
                    'analysis.max_transcript_size_mb': maxTranscriptSize,
                  })
                }
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {t('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-4" />
                {t('emailTemplatesLink')}
              </CardTitle>
              <CardDescription>
                {t('emailTemplatesDescription')}
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/admin/settings/emails`}>
                {t('manageTemplates')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-4" />
                {t('emailLayoutLink')}
              </CardTitle>
              <CardDescription>
                {t('emailLayoutDescription')}
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/admin/settings/email-layout`}>
                {t('manageLayout')}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
