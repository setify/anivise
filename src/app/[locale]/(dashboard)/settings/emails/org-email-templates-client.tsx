'use client'

import { useState, useTransition, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Mail,
  Pencil,
  RotateCcw,
  Eye,
  ArrowLeft,
  Save,
  Loader2,
  Copy,
  Send,
  Info,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Separator } from '@/components/ui/separator'
import {
  saveOrgEmailTemplate,
  resetOrgEmailTemplate,
  sendOrgTestEmail,
} from './actions'
import type { OrgEmailTemplateData } from './actions'
import type { EmailLayoutConfig } from '@/lib/email/send'

interface Props {
  templates: OrgEmailTemplateData[]
  layoutConfig: EmailLayoutConfig
}

const EXAMPLE_VARIABLES: Record<string, string> = {
  inviterName: 'Max Mustermann',
  inviteLink: 'https://app.anivise.com/invite/abc123',
  role: 'Manager',
  expiryDays: '7',
  firstName: 'Maria',
  loginUrl: 'https://app.anivise.com/login',
  email: 'maria@example.com',
  analysisName: 'Analyse - Maria Mueller',
  analysisLink: 'https://app.anivise.com/analyses/abc123',
  sharedBy: 'Max Mustermann',
  employeeName: 'Maria Mueller',
  formTitle: 'Selbsteinschätzung',
  organizationName: 'Acme Corp',
  dueDate: '15.03.2026',
  fillLink: 'https://app.anivise.com/form-fill/abc123',
  assignerName: 'Max Mustermann',
  userName: 'Maria Mueller',
  subjectName: 'Thomas Schmidt',
  reportLink: 'https://app.anivise.com/reports/abc123',
}

function renderWithVariables(template: string): string {
  let result = template
  for (const [key, value] of Object.entries(EXAMPLE_VARIABLES)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

export function OrgEmailTemplatesClient({
  templates: initialTemplates,
  layoutConfig,
}: Props) {
  const t = useTranslations('org.settings.emails')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const [templates, setTemplates] = useState(initialTemplates)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewLocale, setPreviewLocale] = useState<'de' | 'en'>('de')

  // Edit state
  const [editSubjectDe, setEditSubjectDe] = useState('')
  const [editSubjectEn, setEditSubjectEn] = useState('')
  const [editBodyDe, setEditBodyDe] = useState('')
  const [editBodyEn, setEditBodyEn] = useState('')

  const editingTemplate = templates.find((t) => t.slug === editingSlug) ?? null

  function startEdit(tpl: OrgEmailTemplateData) {
    setEditingSlug(tpl.slug)
    setEditSubjectDe(tpl.subjectDe)
    setEditSubjectEn(tpl.subjectEn)
    setEditBodyDe(tpl.bodyDe)
    setEditBodyEn(tpl.bodyEn)
    setShowPreview(false)
  }

  function cancelEdit() {
    setEditingSlug(null)
    setShowPreview(false)
  }

  function insertVariable(variable: string) {
    const placeholder = `{{${variable}}}`
    navigator.clipboard.writeText(placeholder)
    toast.success(t('variableCopied', { variable: placeholder }), {
      className: 'rounded-full',
      position: 'top-center',
    })
  }

  function handleSave() {
    if (!editingSlug) return
    startTransition(async () => {
      const result = await saveOrgEmailTemplate(editingSlug, {
        subjectDe: editSubjectDe,
        subjectEn: editSubjectEn,
        bodyDe: editBodyDe,
        bodyEn: editBodyEn,
      })
      if (result.success) {
        toast.success(t('saved'), {
          className: 'rounded-full',
          position: 'top-center',
        })
        setTemplates((prev) =>
          prev.map((tpl) =>
            tpl.slug === editingSlug
              ? {
                  ...tpl,
                  subjectDe: editSubjectDe,
                  subjectEn: editSubjectEn,
                  bodyDe: editBodyDe,
                  bodyEn: editBodyEn,
                  hasOverride: true,
                  overrideUpdatedAt: new Date(),
                }
              : tpl
          )
        )
        setEditingSlug(null)
        setShowPreview(false)
      } else {
        toast.error(result.error || t('saveError'), {
          className: 'rounded-full',
          position: 'top-center',
        })
      }
    })
  }

  function handleReset() {
    if (!editingSlug) return
    startTransition(async () => {
      const result = await resetOrgEmailTemplate(editingSlug)
      if (result.success && result.template) {
        toast.success(t('resetSuccess'), {
          className: 'rounded-full',
          position: 'top-center',
        })
        const tpl = result.template
        setEditSubjectDe(tpl.subjectDe)
        setEditSubjectEn(tpl.subjectEn)
        setEditBodyDe(tpl.bodyDe)
        setEditBodyEn(tpl.bodyEn)
        setTemplates((prev) =>
          prev.map((p) =>
            p.slug === editingSlug
              ? {
                  ...p,
                  subjectDe: tpl.subjectDe,
                  subjectEn: tpl.subjectEn,
                  bodyDe: tpl.bodyDe,
                  bodyEn: tpl.bodyEn,
                  hasOverride: false,
                  overrideUpdatedAt: null,
                }
              : p
          )
        )
      }
    })
  }

  function handleSendTest() {
    if (!editingSlug) return
    startTransition(async () => {
      const result = await sendOrgTestEmail({
        slug: editingSlug,
        subjectDe: editSubjectDe,
        subjectEn: editSubjectEn,
        bodyDe: editBodyDe,
        bodyEn: editBodyEn,
        locale: (locale as 'de' | 'en') || 'de',
      })
      if (result.success) {
        toast.success(t('testSent'), {
          className: 'rounded-full',
          position: 'top-center',
        })
      } else {
        toast.error(result.error || t('testError'), {
          className: 'rounded-full',
          position: 'top-center',
        })
      }
    })
  }

  // Full layout preview HTML
  const previewHtml = useMemo(() => {
    if (!editingSlug) return ''
    const body = previewLocale === 'de' ? editBodyDe : editBodyEn
    const subject = previewLocale === 'de' ? editSubjectDe : editSubjectEn
    const renderedBody = renderWithVariables(body)
    const renderedSubject = renderWithVariables(subject)

    const logoHtml = layoutConfig.logoUrl
      ? `<img src="${layoutConfig.logoUrl}" alt="${layoutConfig.platformName}" style="max-height:40px;max-width:200px;" />`
      : `<span style="font-size:20px;font-weight:700;color:${layoutConfig.primaryColor};">${layoutConfig.platformName}</span>`

    const footerTemplate =
      previewLocale === 'de'
        ? layoutConfig.footerTextDe
        : layoutConfig.footerTextEn
    const footerText = footerTemplate
      .replace(/\{\{platformName\}\}/g, layoutConfig.platformName)
      .replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString())
      .replace(
        /\{\{supportEmail\}\}/g,
        layoutConfig.supportEmail || 'support@anivise.com'
      )

    return `
      <div style="margin-bottom:12px;padding:8px 12px;background:#f0f0f0;border-radius:6px;">
        <strong>Subject:</strong> ${renderedSubject}
      </div>
      <div style="background:${layoutConfig.bgColor};padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:600px;margin:0 auto;">
          <div style="background:${layoutConfig.contentBgColor};border-radius:${layoutConfig.borderRadius}px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e4e4e7;">
              ${logoHtml}
            </div>
            ${renderedBody}
          </div>
          <div style="text-align:center;margin-top:24px;color:#a1a1aa;font-size:12px;">
            <p>${footerText}</p>
          </div>
        </div>
      </div>
    `
  }, [
    editingSlug,
    previewLocale,
    editBodyDe,
    editBodyEn,
    editSubjectDe,
    editSubjectEn,
    layoutConfig,
  ])

  const variables = editingTemplate
    ? (editingTemplate.availableVariables as string[])
    : []

  // Editing view
  if (editingTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={cancelEdit}>
            <ArrowLeft className="mr-2 size-4" />
            {t('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {editingTemplate.name}
            </h1>
            <p className="text-muted-foreground">
              {editingTemplate.description}
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-muted/50 flex items-start gap-3 rounded-lg border p-4">
          <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-sm">
            {editingTemplate.hasOverride
              ? t('overrideBanner')
              : t('defaultBanner')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
          <div className="space-y-6">
            <Tabs defaultValue="de">
              <TabsList>
                <TabsTrigger value="de">Deutsch</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
              </TabsList>

              <TabsContent value="de" className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('subject')}</Label>
                  <Input
                    value={editSubjectDe}
                    onChange={(e) => setEditSubjectDe(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('body')}</Label>
                  <RichTextEditor
                    value={editBodyDe}
                    onChange={setEditBodyDe}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewLocale('de')
                    setShowPreview(true)
                  }}
                >
                  <Eye className="mr-2 size-4" />
                  {t('preview')}
                </Button>
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('subject')}</Label>
                  <Input
                    value={editSubjectEn}
                    onChange={(e) => setEditSubjectEn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('body')}</Label>
                  <RichTextEditor
                    value={editBodyEn}
                    onChange={setEditBodyEn}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewLocale('en')
                    setShowPreview(true)
                  }}
                >
                  <Eye className="mr-2 size-4" />
                  {t('preview')}
                </Button>
              </TabsContent>
            </Tabs>

            {showPreview && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {t('previewTitle')}
                    </CardTitle>
                    <Tabs
                      value={previewLocale}
                      onValueChange={(v) =>
                        setPreviewLocale(v as 'de' | 'en')
                      }
                    >
                      <TabsList className="h-8">
                        <TabsTrigger value="de" className="h-6 px-2 text-xs">
                          DE
                        </TabsTrigger>
                        <TabsTrigger value="en" className="h-6 px-2 text-xs">
                          EN
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  <div
                    className="overflow-auto"
                    style={{ maxHeight: '500px' }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-3">
              <Button disabled={isPending} onClick={handleSave}>
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {t('save')}
              </Button>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={handleSendTest}
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                {t('sendTestToMe')}
              </Button>
              {editingTemplate.hasOverride && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isPending}>
                      <RotateCcw className="mr-2 size-4" />
                      {t('resetToDefault')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('resetConfirm')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('resetDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t('back')}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset}>
                        {t('resetToDefault')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('variables')}</CardTitle>
              <CardDescription>{t('variablesHint')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {variables.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
                >
                  <Copy className="text-muted-foreground size-3" />
                  <code className="text-xs">{`{{${variable}}}`}</code>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columnName')}</TableHead>
                  <TableHead>{t('columnSlug')}</TableHead>
                  <TableHead>{t('columnStatus')}</TableHead>
                  <TableHead className="w-[120px]">
                    {t('columnActions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.slug}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="text-muted-foreground size-4" />
                        <div>
                          <div>{template.name}</div>
                          {template.description && (
                            <div className="text-muted-foreground text-xs">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{template.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          template.hasOverride ? 'default' : 'secondary'
                        }
                      >
                        {template.hasOverride
                          ? t('statusCustomized')
                          : t('statusDefault')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(template)}
                      >
                        <Pencil className="mr-1 size-3.5" />
                        {t('edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
