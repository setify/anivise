'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createForm,
  checkFormSlugAvailability,
} from '@/app/[locale]/(superadmin)/admin/forms/actions'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function FormMetaForm() {
  const t = useTranslations('admin.forms.meta')
  const locale = useLocale()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [stepDisplayMode, setStepDisplayMode] = useState<'progress_bar' | 'tabs'>('progress_bar')
  const [visibility, setVisibility] = useState<'all_organizations' | 'assigned'>('assigned')
  const [submitting, setSubmitting] = useState(false)

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title))
    }
  }, [title, slugManuallyEdited])

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null)
      return
    }
    const timer = setTimeout(async () => {
      const { available } = await checkFormSlugAvailability(slug)
      setSlugAvailable(available)
    }, 500)
    return () => clearTimeout(timer)
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return
    if (slugAvailable === false) return

    setSubmitting(true)
    const result = await createForm({
      title: title.trim(),
      description: description.trim() || undefined,
      slug: slug.trim(),
      stepDisplayMode,
      visibility,
    })

    if (result.success) {
      router.push(`/${locale}/admin/forms/${result.formId}/edit`)
    } else {
      toast.error(result.error ?? t('error'), { className: 'rounded-full' })
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('basicData')}</CardTitle>
          <CardDescription>{t('basicDataDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('formTitle')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('formTitlePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('formDescription')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('formDescriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t('slug')}</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManuallyEdited(true)
              }}
              placeholder={t('slugPlaceholder')}
              required
            />
            {slug && slugAvailable === false && (
              <p className="text-destructive text-xs">{t('slugTaken')}</p>
            )}
            {slug && slugAvailable === true && (
              <p className="text-xs text-green-600">{t('slugAvailable')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('displaySettings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('stepDisplayMode')}</Label>
            <Select
              value={stepDisplayMode}
              onValueChange={(v) => setStepDisplayMode(v as typeof stepDisplayMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress_bar">{t('progressBar')}</SelectItem>
                <SelectItem value="tabs">{t('tabs')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('visibility')}</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as typeof visibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_organizations">{t('visibilityAll')}</SelectItem>
                <SelectItem value="assigned">{t('visibilityAssigned')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || !title.trim() || slugAvailable === false}>
          {submitting ? t('creating') : t('continue')}
        </Button>
      </div>
    </form>
  )
}
