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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Separator } from '@/components/ui/separator'
import {
  updateEmailTemplate,
  resetEmailTemplate,
  sendTestTemplateEmail,
} from '../../actions'
import Link from 'next/link'
import type { EmailLayoutConfig } from '@/lib/email/send'

interface EmailTemplate {
  id: string
  slug: string
  name: string
  description: string | null
  subjectDe: string
  subjectEn: string
  bodyDe: string
  bodyEn: string
  availableVariables: unknown
  isSystem: boolean
  lastTestSentAt: Date | null
  updatedAt: Date
}

interface Props {
  templates: EmailTemplate[]
  currentUser: { id: string }
  layoutConfig: EmailLayoutConfig
}

const EXAMPLE_VARIABLES: Record<string, string> = {
  inviterName: 'Max Mustermann',
  role: 'Superadmin',
  inviteLink: 'https://app.anivise.com/invite/abc123',
  expiryDays: '7',
  orgName: 'Acme Corp',
  userName: 'Maria Mueller',
  loginLink: 'https://app.anivise.com/login',
  resetLink: 'https://app.anivise.com/reset/abc123',
  expiryMinutes: '60',
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

export function EmailTemplatesClient({
  templates: initialTemplates,
  layoutConfig,
}: Props) {
  const t = useTranslations('admin.emailTemplates')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const [templates, setTemplates] = useState(initialTemplates)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  )
  const [showPreview, setShowPreview] = useState(false)
  const [previewLocale, setPreviewLocale] = useState<'de' | 'en'>('de')

  // Edit state
  const [editSubjectDe, setEditSubjectDe] = useState('')
  const [editSubjectEn, setEditSubjectEn] = useState('')
  const [editBodyDe, setEditBodyDe] = useState('')
  const [editBodyEn, setEditBodyEn] = useState('')

  function startEdit(template: EmailTemplate) {
    setEditingTemplate(template)
    setEditSubjectDe(template.subjectDe)
    setEditSubjectEn(template.subjectEn)
    setEditBodyDe(template.bodyDe)
    setEditBodyEn(template.bodyEn)
    setShowPreview(false)
  }

  function cancelEdit() {
    setEditingTemplate(null)
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
    if (!editingTemplate) return
    startTransition(async () => {
      const result = await updateEmailTemplate(editingTemplate.id, {
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
            tpl.id === editingTemplate.id
              ? {
                  ...tpl,
                  subjectDe: editSubjectDe,
                  subjectEn: editSubjectEn,
                  bodyDe: editBodyDe,
                  bodyEn: editBodyEn,
                  updatedAt: new Date(),
                }
              : tpl
          )
        )
        setEditingTemplate(null)
        setShowPreview(false)
      } else {
        toast.error(result.error || t('error'), {
          className: 'rounded-full',
          position: 'top-center',
        })
      }
    })
  }

  function handleReset() {
    if (!editingTemplate) return
    startTransition(async () => {
      const result = await resetEmailTemplate(editingTemplate.slug)
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
            p.id === editingTemplate.id ? { ...p, ...tpl } : p
          )
        )
      }
    })
  }

  function handleSendTest(templateOrEdit?: EmailTemplate) {
    const tpl = templateOrEdit || editingTemplate
    if (!tpl) return

    const isEditing = !templateOrEdit
    const subjectDe = isEditing ? editSubjectDe : tpl.subjectDe
    const subjectEn = isEditing ? editSubjectEn : tpl.subjectEn
    const bodyDe = isEditing ? editBodyDe : tpl.bodyDe
    const bodyEn = isEditing ? editBodyEn : tpl.bodyEn

    startTransition(async () => {
      const result = await sendTestTemplateEmail({
        subjectDe,
        subjectEn,
        bodyDe,
        bodyEn,
        templateId: tpl.id,
        templateSlug: tpl.slug,
        locale: (locale as 'de' | 'en') || 'de',
      })
      if (result.success) {
        toast.success(t('testSent'), {
          className: 'rounded-full',
          position: 'top-center',
        })
        setTemplates((prev) =>
          prev.map((p) =>
            p.id === tpl.id ? { ...p, lastTestSentAt: new Date() } : p
          )
        )
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
    if (!editingTemplate) return ''
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
        <strong>Subject:</strong> [TEST] ${renderedSubject}
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
    editingTemplate,
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
                {t('saveTemplate')}
              </Button>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => handleSendTest()}
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                {t('sendTestToMe')}
              </Button>
              {editingTemplate.isSystem && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={handleReset}
                >
                  <RotateCcw className="mr-2 size-4" />
                  {t('resetToDefault')}
                </Button>
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/admin/settings`}>
            <ArrowLeft className="mr-2 size-4" />
            {t('backToSettings')}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columnName')}</TableHead>
                  <TableHead>{t('columnSlug')}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('columnDescription')}
                  </TableHead>
                  <TableHead>{t('columnType')}</TableHead>
                  <TableHead className="w-[180px]">
                    {t('columnActions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="text-muted-foreground size-4" />
                        {template.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{template.slug}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                      {template.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          template.isSystem ? 'secondary' : 'outline'
                        }
                      >
                        {template.isSystem
                          ? t('systemTemplate')
                          : t('customTemplate')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(template)}
                        >
                          <Pencil className="mr-1 size-3.5" />
                          {t('edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleSendTest(template)}
                        >
                          {isPending ? (
                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                          ) : (
                            <Send className="mr-1 size-3.5" />
                          )}
                          {t('sendTest')}
                        </Button>
                      </div>
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
