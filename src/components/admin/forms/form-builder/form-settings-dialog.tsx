'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  updateFormMeta,
  checkFormSlugAvailability,
  setFormStatus,
  getEmailTemplates,
} from '@/app/[locale]/(superadmin)/admin/forms/actions'
import { OrgAssignmentPanel } from './org-assignment-panel'
import type { Form } from '@/types/database'

interface FormSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form
  onFormUpdated?: () => void
}

export function FormSettingsDialog({
  open,
  onOpenChange,
  form,
  onFormUpdated,
}: FormSettingsDialogProps) {
  const t = useTranslations('admin.forms.settingsDialog')
  const [title, setTitle] = useState(form.title)
  const [description, setDescription] = useState(form.description ?? '')
  const [slug, setSlug] = useState(form.slug)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [stepDisplayMode, setStepDisplayMode] = useState<string>(form.stepDisplayMode)
  const [completionType, setCompletionType] = useState<string>(form.completionType)
  const [completionTitle, setCompletionTitle] = useState(form.completionTitle ?? '')
  const [completionMessage, setCompletionMessage] = useState(form.completionMessage ?? '')
  const [completionRedirectUrl, setCompletionRedirectUrl] = useState(form.completionRedirectUrl ?? '')
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(form.sendConfirmationEmail)
  const [saving, setSaving] = useState(false)
  const [emailTemplates, setEmailTemplates] = useState<{ id: string; slug: string }[]>([])

  useEffect(() => {
    if (open) {
      getEmailTemplates().then(setEmailTemplates)
    }
  }, [open])

  // Slug availability check
  useEffect(() => {
    if (slug === form.slug) {
      setSlugAvailable(null)
      return
    }
    const timer = setTimeout(async () => {
      const result = await checkFormSlugAvailability(slug, form.id)
      setSlugAvailable(result.available)
    }, 500)
    return () => clearTimeout(timer)
  }, [slug, form.slug, form.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateFormMeta(form.id, {
        title,
        description: description || undefined,
        slug: slug !== form.slug ? slug : undefined,
        stepDisplayMode: stepDisplayMode as 'progress_bar' | 'tabs',
        completionType: completionType as 'thank_you' | 'redirect',
        completionTitle: completionTitle || undefined,
        completionMessage: completionMessage || undefined,
        completionRedirectUrl: completionRedirectUrl || undefined,
        sendConfirmationEmail,
      })

      if (result.success) {
        toast.success(t('saved'), { className: 'rounded-full' })
        onFormUpdated?.()
      } else {
        toast.error(result.error ?? t('saveError'), { className: 'rounded-full' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    const result = await setFormStatus(form.id, newStatus as 'draft' | 'published' | 'archived')
    if (result.success) {
      toast.success(t('statusChanged'), { className: 'rounded-full' })
      onFormUpdated?.()
    } else {
      toast.error(result.error ?? t('statusError'), { className: 'rounded-full' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">{t('tabGeneral')}</TabsTrigger>
            <TabsTrigger value="completion" className="flex-1">{t('tabCompletion')}</TabsTrigger>
            <TabsTrigger value="organizations" className="flex-1">{t('tabOrganizations')}</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('formTitle')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t('formDescription')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('slug')}</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              {slugAvailable === false && (
                <p className="text-destructive text-xs">{t('slugTaken')}</p>
              )}
              {slugAvailable === true && (
                <p className="text-xs text-green-600">{t('slugAvailable')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('stepDisplayMode')}</Label>
              <Select value={stepDisplayMode} onValueChange={setStepDisplayMode}>
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
              <Label>{t('status')}</Label>
              <div className="flex items-center gap-2">
                <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
                  {form.status}
                </Badge>
                {form.status === 'published' && (
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange('draft')}>
                    {t('unpublish')}
                  </Button>
                )}
                {form.status === 'archived' && (
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange('draft')}>
                    {t('reactivate')}
                  </Button>
                )}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving || slugAvailable === false}>
              {saving ? t('saving') : t('save')}
            </Button>
          </TabsContent>

          {/* Completion Tab */}
          <TabsContent value="completion" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('completionType')}</Label>
              <Select value={completionType} onValueChange={setCompletionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thank_you">{t('thankYouPage')}</SelectItem>
                  <SelectItem value="redirect">{t('redirect')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {completionType === 'thank_you' && (
              <>
                <div className="space-y-2">
                  <Label>{t('completionTitleLabel')}</Label>
                  <Input
                    value={completionTitle}
                    onChange={(e) => setCompletionTitle(e.target.value)}
                    placeholder={t('completionTitlePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('completionMessageLabel')}</Label>
                  <Textarea
                    value={completionMessage}
                    onChange={(e) => setCompletionMessage(e.target.value)}
                    placeholder={t('completionMessagePlaceholder')}
                    rows={3}
                  />
                </div>
              </>
            )}

            {completionType === 'redirect' && (
              <div className="space-y-2">
                <Label>{t('redirectUrl')}</Label>
                <Input
                  type="url"
                  value={completionRedirectUrl}
                  onChange={(e) => setCompletionRedirectUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch
                checked={sendConfirmationEmail}
                onCheckedChange={setSendConfirmationEmail}
              />
              <Label>{t('sendConfirmationEmail')}</Label>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? t('saving') : t('save')}
            </Button>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="pt-4">
            <OrgAssignmentPanel formId={form.id} visibility={form.visibility as 'all_organizations' | 'assigned'} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
