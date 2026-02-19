'use client'

import { useState, useTransition, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Images, RotateCcw, Upload, X } from 'lucide-react'
import { BrandingPreview } from '@/components/org/branding-preview'
import { saveBrandingSettings, type OrgBrandingData } from '../actions'
import { isValidHex, normalizeHex } from '@/lib/branding/color-utils'
import { OrgMediaPicker } from './org-media-picker'

// Anivise default colors – must match globals.css / tailwind config
const DEFAULT_COLORS = {
  primary: '#6366f1',
  accent: '#f59e0b',
  background: '#ffffff',
  text: '#1e293b',
}

// ─── Color Picker ─────────────────────────────────────────────────────────────

interface ColorPickerProps {
  label: string
  value: string
  onChange: (v: string) => void
  name: string
}

function ColorPicker({ label, value, onChange, name }: ColorPickerProps) {
  const [inputVal, setInputVal] = useState(value)

  // Sync when parent resets
  if (inputVal !== value && isValidHex(value)) {
    setInputVal(value)
  }

  function handleTextChange(v: string) {
    setInputVal(v)
    const normalized = normalizeHex(v)
    if (isValidHex(normalized)) onChange(normalized)
  }

  function handleColorInput(v: string) {
    setInputVal(v)
    onChange(v)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => handleColorInput(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded border p-0.5"
          title={label}
        />
        <Input
          id={name}
          name={name}
          value={inputVal}
          onChange={(e) => handleTextChange(e.target.value)}
          className="font-mono w-28"
          maxLength={7}
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
  label: string
  hint: string
  accept: string
  maxBytes: number
  currentUrl: string | null
  previewMode?: 'logo' | 'favicon'
  onFileSelect: (file: File | null) => void
  onUrlSelect: (url: string) => void
  onRemove: () => void
  removed: boolean
  fileSelected: File | null
  selectedUrl: string | null
}

function UploadZone({
  label,
  hint,
  accept,
  maxBytes,
  currentUrl,
  previewMode = 'logo',
  onFileSelect,
  onUrlSelect,
  onRemove,
  removed,
  fileSelected,
  selectedUrl,
}: UploadZoneProps) {
  const t = useTranslations('org.settings.branding')
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)

  const previewSrc = fileSelected
    ? URL.createObjectURL(fileSelected)
    : selectedUrl
    ? selectedUrl
    : !removed
    ? currentUrl
    : null

  function handleFile(file: File) {
    if (file.size > maxBytes) {
      toast.error(t('fileTooLarge', { max: (maxBytes / 1024 / 1024).toFixed(1) + ' MB' }))
      return
    }
    onFileSelect(file)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-muted-foreground text-xs">{hint}</p>

      {previewSrc && (
        <div className="flex items-center gap-3">
          {previewMode === 'favicon' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="Favicon preview" className="size-8 rounded border object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="Logo preview" className="h-10 max-w-[160px] rounded border object-contain p-1" />
          )}
        </div>
      )}

      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-sm transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        <Upload className="text-muted-foreground mb-2 size-5" />
        <span className="text-muted-foreground text-xs">{t('dropOrClick')}</span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMediaOpen(true)}
        >
          <Images className="mr-1.5 size-3.5" />
          Aus Mediathek
        </Button>
        {previewSrc && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <X className="mr-1.5 size-3.5" />
            {t('remove')}
          </Button>
        )}
      </div>

      <OrgMediaPicker
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelect={(url) => {
          onUrlSelect(url)
          setMediaOpen(false)
        }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  data: OrgBrandingData
  orgName: string
}

export function BrandingClient({ data, orgName }: Props) {
  const t = useTranslations('org.settings.branding')
  const tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()

  const [primary, setPrimary] = useState(data.brandPrimaryColor ?? DEFAULT_COLORS.primary)
  const [accent, setAccent] = useState(data.brandAccentColor ?? DEFAULT_COLORS.accent)
  const [background, setBackground] = useState(data.brandBackgroundColor ?? DEFAULT_COLORS.background)
  const [textColor, setTextColor] = useState(data.brandTextColor ?? DEFAULT_COLORS.text)
  const [emailFooter, setEmailFooter] = useState(data.emailFooterText ?? '')

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [removeFavicon, setRemoveFavicon] = useState(false)

  function resetColors() {
    setPrimary(DEFAULT_COLORS.primary)
    setAccent(DEFAULT_COLORS.accent)
    setBackground(DEFAULT_COLORS.background)
    setTextColor(DEFAULT_COLORS.text)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (logoFile) {
      fd.set('logoFile', logoFile)
    } else if (logoUrl) {
      fd.set('logoUrl', logoUrl)
    } else if (removeLogo) {
      fd.set('removeLogo', 'true')
    }
    if (faviconFile) {
      fd.set('faviconFile', faviconFile)
    } else if (faviconUrl) {
      fd.set('faviconUrl', faviconUrl)
    } else if (removeFavicon) {
      fd.set('removeFavicon', 'true')
    }

    startTransition(async () => {
      const result = await saveBrandingSettings(fd)
      if (result.success) {
        toast.success(t('saveSuccess'))
      } else {
        toast.error(result.error ?? tc('error'))
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* LEFT: Settings */}
          <div className="space-y-5">
            {/* Logo + Favicon side by side */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('logo')}</CardTitle>
                  <CardDescription>{t('logoHint')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadZone
                    label={t('logo')}
                    hint={t('logoSizeHint')}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    maxBytes={2 * 1024 * 1024}
                    currentUrl={data.logoPublicUrl}
                    previewMode="logo"
                    onFileSelect={(f) => { setLogoFile(f); setLogoUrl(null); setRemoveLogo(false) }}
                    onUrlSelect={(url) => { setLogoUrl(url); setLogoFile(null); setRemoveLogo(false) }}
                    onRemove={() => { setLogoFile(null); setLogoUrl(null); setRemoveLogo(true) }}
                    removed={removeLogo}
                    fileSelected={logoFile}
                    selectedUrl={logoUrl}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('favicon')}</CardTitle>
                  <CardDescription>{t('faviconHint')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadZone
                    label={t('favicon')}
                    hint={t('faviconSizeHint')}
                    accept="image/x-icon,image/png,image/svg+xml"
                    maxBytes={500 * 1024}
                    currentUrl={data.faviconPublicUrl}
                    previewMode="favicon"
                    onFileSelect={(f) => { setFaviconFile(f); setFaviconUrl(null); setRemoveFavicon(false) }}
                    onUrlSelect={(url) => { setFaviconUrl(url); setFaviconFile(null); setRemoveFavicon(false) }}
                    onRemove={() => { setFaviconFile(null); setFaviconUrl(null); setRemoveFavicon(true) }}
                    removed={removeFavicon}
                    fileSelected={faviconFile}
                    selectedUrl={faviconUrl}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Colors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('colors')}</CardTitle>
                <CardDescription>{t('colorsHint')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ColorPicker label={t('primaryColor')} value={primary} onChange={setPrimary} name="brandPrimaryColor" />
                <ColorPicker label={t('accentColor')} value={accent} onChange={setAccent} name="brandAccentColor" />
                <ColorPicker label={t('backgroundColor')} value={background} onChange={setBackground} name="brandBackgroundColor" />
                <ColorPicker label={t('textColor')} value={textColor} onChange={setTextColor} name="brandTextColor" />

                <Button type="button" variant="ghost" size="sm" onClick={resetColors}>
                  <RotateCcw className="mr-2 size-3.5" />
                  {t('resetToDefault')}
                </Button>
              </CardContent>
            </Card>

            {/* Email Footer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('emailFooter')}</CardTitle>
                <CardDescription>{t('emailFooterHint')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  name="emailFooterText"
                  value={emailFooter}
                  onChange={(e) => setEmailFooter(e.target.value)}
                  placeholder={t('emailFooterPlaceholder')}
                  maxLength={200}
                  rows={3}
                />
                <p className="text-muted-foreground text-right text-xs">{emailFooter.length}/200</p>
              </CardContent>
            </Card>

            <Separator />

            <div className="flex gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? tc('saving') : tc('save')}
              </Button>
            </div>
          </div>

          {/* RIGHT: Preview (sticky) */}
          <div className="lg:sticky lg:top-4 space-y-3 self-start">
            <p className="text-sm font-medium">{t('preview')}</p>
            <BrandingPreview
              primaryColor={primary}
              accentColor={accent}
              backgroundColor={background}
              textColor={textColor}
              logoUrl={logoUrl ?? (logoFile ? URL.createObjectURL(logoFile) : !removeLogo ? data.logoPublicUrl : null)}
              orgName={orgName}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
