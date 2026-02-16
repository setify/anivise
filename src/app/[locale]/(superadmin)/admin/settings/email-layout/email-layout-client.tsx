'use client'

import { useState, useTransition, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Save,
  Loader2,
  Send,
  Monitor,
  Smartphone,
  RotateCcw,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { saveEmailLayout, sendTestLayoutEmail } from './actions'
import type { EmailLayoutConfig } from '@/lib/email/send'

const DEFAULT_CONFIG: EmailLayoutConfig = {
  logoUrl: '',
  logoLink: '',
  bgColor: '#f4f4f5',
  contentBgColor: '#ffffff',
  primaryColor: '#4f46e5',
  textColor: '#18181b',
  linkColor: '#4f46e5',
  footerTextDe: 'Diese E-Mail wurde von der {{platformName}}-Plattform gesendet.',
  footerTextEn: 'This email was sent by the {{platformName}} platform.',
  borderRadius: 12,
  supportEmail: '',
  platformName: 'Anivise',
}

export function EmailLayoutPageClient({ config }: { config: EmailLayoutConfig }) {
  const t = useTranslations('admin.emailLayout')
  const [isPending, startTransition] = useTransition()
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const [logoUrl, setLogoUrl] = useState(config.logoUrl)
  const [logoLink, setLogoLink] = useState(config.logoLink)
  const [bgColor, setBgColor] = useState(config.bgColor)
  const [contentBgColor, setContentBgColor] = useState(config.contentBgColor)
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor)
  const [textColor, setTextColor] = useState(config.textColor)
  const [linkColor, setLinkColor] = useState(config.linkColor)
  const [footerTextDe, setFooterTextDe] = useState(config.footerTextDe)
  const [footerTextEn, setFooterTextEn] = useState(config.footerTextEn)
  const [borderRadius, setBorderRadius] = useState(config.borderRadius)
  const [supportEmail, setSupportEmail] = useState(config.supportEmail)

  function handleSave() {
    startTransition(async () => {
      const result = await saveEmailLayout({
        logoUrl,
        logoLink,
        bgColor,
        contentBgColor,
        primaryColor,
        textColor,
        linkColor,
        footerTextDe,
        footerTextEn,
        borderRadius,
        supportEmail,
      })
      if (result.success) {
        toast.success(t('saved'), { className: 'rounded-full', position: 'top-center' })
      } else {
        toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
      }
    })
  }

  function handleSendTest() {
    startTransition(async () => {
      const result = await sendTestLayoutEmail()
      if (result.success) {
        toast.success(t('testSent'), { className: 'rounded-full', position: 'top-center' })
      } else {
        toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
      }
    })
  }

  function handleReset() {
    setLogoUrl(DEFAULT_CONFIG.logoUrl)
    setLogoLink(DEFAULT_CONFIG.logoLink)
    setBgColor(DEFAULT_CONFIG.bgColor)
    setContentBgColor(DEFAULT_CONFIG.contentBgColor)
    setPrimaryColor(DEFAULT_CONFIG.primaryColor)
    setTextColor(DEFAULT_CONFIG.textColor)
    setLinkColor(DEFAULT_CONFIG.linkColor)
    setFooterTextDe(DEFAULT_CONFIG.footerTextDe)
    setFooterTextEn(DEFAULT_CONFIG.footerTextEn)
    setBorderRadius(DEFAULT_CONFIG.borderRadius)
    setSupportEmail(DEFAULT_CONFIG.supportEmail)
  }

  const resolvedFooter = useMemo(() => {
    const template = footerTextDe
    return template
      .replace(/\{\{platformName\}\}/g, config.platformName || 'Anivise')
      .replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString())
      .replace(/\{\{supportEmail\}\}/g, supportEmail || 'support@anivise.com')
  }, [footerTextDe, config.platformName, supportEmail])

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${config.platformName}" style="max-height:40px;max-width:200px;" />`
    : `<span style="font-size:20px;font-weight:700;color:${primaryColor};">${config.platformName || 'Anivise'}</span>`

  const previewHtml = `
    <div style="background:${bgColor};padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;">
        <div style="background:${contentBgColor};border-radius:${borderRadius}px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e4e4e7;">
            ${logoHtml}
          </div>
          <h2 style="margin:0 0 16px;color:${textColor};">Willkommen bei ${config.platformName || 'Anivise'}</h2>
          <p style="margin:0 0 12px;color:${textColor};line-height:1.6;">
            Dies ist eine Vorschau des E-Mail-Layouts. So werden alle E-Mails der Plattform aussehen.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="#" style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:${Math.min(borderRadius, 8)}px;font-weight:600;">
              Beispiel-Button
            </a>
          </div>
          <p style="margin:0;color:#71717a;font-size:13px;">
            <a href="#" style="color:${linkColor};text-decoration:underline;">Beispiel-Link</a>
          </p>
        </div>
        <div style="text-align:center;margin-top:24px;color:#a1a1aa;font-size:12px;">
          <p>${resolvedFooter}</p>
        </div>
      </div>
    </div>
  `

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings Column */}
        <div className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('logo.title')}</CardTitle>
              <CardDescription>{t('logo.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>{t('logo.url')}</Label>
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <Label>{t('logo.link')}</Label>
                <Input
                  value={logoLink}
                  onChange={(e) => setLogoLink(e.target.value)}
                  placeholder="https://anivise.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('colors.title')}</CardTitle>
              <CardDescription>{t('colors.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ColorField label={t('colors.background')} value={bgColor} onChange={setBgColor} />
                <ColorField label={t('colors.contentBg')} value={contentBgColor} onChange={setContentBgColor} />
                <ColorField label={t('colors.primary')} value={primaryColor} onChange={setPrimaryColor} />
                <ColorField label={t('colors.text')} value={textColor} onChange={setTextColor} />
                <ColorField label={t('colors.links')} value={linkColor} onChange={setLinkColor} />
                <div>
                  <Label>{t('colors.borderRadius')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground text-sm">px</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('footer.title')}</CardTitle>
              <CardDescription>{t('footer.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>{t('footer.textDe')}</Label>
                <Textarea
                  rows={2}
                  value={footerTextDe}
                  onChange={(e) => setFooterTextDe(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('footer.textEn')}</Label>
                <Textarea
                  rows={2}
                  value={footerTextEn}
                  onChange={(e) => setFooterTextEn(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('footer.supportEmail')}</Label>
                <Input
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@anivise.com"
                />
              </div>
              <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
                <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <p className="text-muted-foreground text-xs">{t('footer.hint')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />}
              {t('save')}
            </Button>
            <Button variant="outline" onClick={handleSendTest} disabled={isPending}>
              {isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Send className="mr-1.5 size-4" />}
              {t('sendTest')}
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="mr-1.5 size-4" />
              {t('reset')}
            </Button>
          </div>
        </div>

        {/* Preview Column */}
        <div className="space-y-3">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('preview.title')}</CardTitle>
                <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'desktop' | 'mobile')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="desktop" className="h-6 px-2">
                      <Monitor className="size-3.5" />
                    </TabsTrigger>
                    <TabsTrigger value="mobile" className="h-6 px-2">
                      <Smartphone className="size-3.5" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardDescription>{t('preview.description')}</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="overflow-hidden p-0">
              <div
                className={`mx-auto overflow-auto ${
                  previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
                }`}
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              >
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 cursor-pointer rounded border"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-xs"
          maxLength={7}
        />
      </div>
    </div>
  )
}
