'use client'

import { useState, useTransition } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateEmailTemplate, resetEmailTemplate } from '../../actions'
import Link from 'next/link'

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
  updatedAt: Date
}

interface Props {
  templates: EmailTemplate[]
  currentUser: { id: string }
}

// Example values for preview
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

export function EmailTemplatesClient({ templates: initialTemplates }: Props) {
  const t = useTranslations('admin.emailTemplates')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const [templates, setTemplates] = useState(initialTemplates)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

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
    setPreviewHtml(null)
  }

  function cancelEdit() {
    setEditingTemplate(null)
    setPreviewHtml(null)
  }

  function renderPreview(body: string, subject: string) {
    let rendered = body
    let renderedSubject = subject
    for (const [key, value] of Object.entries(EXAMPLE_VARIABLES)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, value)
      renderedSubject = renderedSubject.replace(regex, value)
    }
    setPreviewHtml(
      `<div style="padding:8px;"><p style="margin:0 0 8px;font-weight:600;">Subject: ${renderedSubject}</p><hr/>${rendered}</div>`
    )
  }

  function insertVariable(variable: string) {
    // Insert at cursor position of the active textarea
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
        // Update local state
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
        setPreviewHtml(null)
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
                  <Textarea
                    className="min-h-[300px] font-mono text-sm"
                    value={editBodyDe}
                    onChange={(e) => setEditBodyDe(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => renderPreview(editBodyDe, editSubjectDe)}
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
                  <Textarea
                    className="min-h-[300px] font-mono text-sm"
                    value={editBodyEn}
                    onChange={(e) => setEditBodyEn(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => renderPreview(editBodyEn, editSubjectEn)}
                >
                  <Eye className="mr-2 size-4" />
                  {t('preview')}
                </Button>
              </TabsContent>
            </Tabs>

            {previewHtml && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('previewTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="rounded-md border bg-white p-4"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button disabled={isPending} onClick={handleSave}>
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {t('saveTemplate')}
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
                  <TableHead className="w-[100px]">{t('columnActions')}</TableHead>
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
                      <Badge variant={template.isSystem ? 'secondary' : 'outline'}>
                        {template.isSystem ? t('systemTemplate') : t('customTemplate')}
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
