'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Copy, Archive, Trash2, Globe, Inbox, RotateCcw, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  duplicateForm,
  archiveForm,
  publishForm,
  deleteForm,
  setFormStatus,
} from '@/app/[locale]/(superadmin)/admin/forms/actions'
import type { Form } from '@/types/database'

interface FormWithCounts extends Form {
  submissionCount: number
  assignmentCount: number
}

interface FormListTableProps {
  forms: FormWithCounts[]
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
}

export function FormListTable({ forms }: FormListTableProps) {
  const t = useTranslations('admin.forms')
  const locale = useLocale()
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDuplicate = async (formId: string) => {
    const result = await duplicateForm(formId)
    if (result.success) {
      toast.success(t('duplicated'), { className: 'rounded-full' })
      router.refresh()
    } else {
      toast.error(result.error ?? t('error'), { className: 'rounded-full' })
    }
  }

  const handleArchive = async (formId: string) => {
    const result = await archiveForm(formId)
    if (result.success) {
      toast.success(t('archived'), { className: 'rounded-full' })
      router.refresh()
    }
  }

  const handlePublish = async (formId: string) => {
    const result = await publishForm(formId)
    if (result.success) {
      toast.success(t('published'), { className: 'rounded-full' })
      router.refresh()
    }
  }

  const handleUnpublish = async (formId: string) => {
    const result = await setFormStatus(formId, 'draft')
    if (result.success) {
      toast.success(t('statusChanged'), { className: 'rounded-full' })
      router.refresh()
    }
  }

  const handleReactivate = async (formId: string) => {
    const result = await setFormStatus(formId, 'draft')
    if (result.success) {
      toast.success(t('statusChanged'), { className: 'rounded-full' })
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const result = await deleteForm(deleteId)
    if (result.success) {
      toast.success(t('deleted'), { className: 'rounded-full' })
      setDeleteId(null)
      router.refresh()
    } else {
      toast.error(result.error ?? t('error'), { className: 'rounded-full' })
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/forms/new`}>
            <Plus className="mr-2 size-4" />
            {t('newForm')}
          </Link>
        </Button>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground text-sm">{t('noForms')}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={`/${locale}/admin/forms/new`}>
              <Plus className="mr-2 size-4" />
              {t('newForm')}
            </Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnTitle')}</TableHead>
              <TableHead>{t('columnStatus')}</TableHead>
              <TableHead>{t('columnVisibility')}</TableHead>
              <TableHead>{t('columnVersion')}</TableHead>
              <TableHead>{t('columnSubmissions')}</TableHead>
              <TableHead>{t('columnCreated')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => (
              <TableRow key={form.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{form.title}</p>
                    <p className="text-muted-foreground text-xs">/{form.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[form.status] ?? 'secondary'}>
                    {t(`status.${form.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {form.visibility === 'all_organizations'
                    ? t('visibilityAll')
                    : t('visibilityAssigned', { count: form.assignmentCount })}
                </TableCell>
                <TableCell>v{form.currentVersion}</TableCell>
                <TableCell>{form.submissionCount}</TableCell>
                <TableCell>{formatDate(form.createdAt)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <span className="sr-only">{t('actions')}</span>
                        ···
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/admin/forms/${form.id}/edit`}>
                          <Pencil className="mr-2 size-4" />
                          {t('edit')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/admin/forms/${form.id}/submissions`}>
                          <Inbox className="mr-2 size-4" />
                          {t('viewSubmissionsAction')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                        <Copy className="mr-2 size-4" />
                        {t('duplicate')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {form.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handlePublish(form.id)}>
                          <Globe className="mr-2 size-4" />
                          {t('publishAction')}
                        </DropdownMenuItem>
                      )}
                      {form.status === 'published' && (
                        <>
                          <DropdownMenuItem onClick={() => handleUnpublish(form.id)}>
                            <RotateCcw className="mr-2 size-4" />
                            {t('unpublishAction')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(form.id)}>
                            <Archive className="mr-2 size-4" />
                            {t('archiveAction')}
                          </DropdownMenuItem>
                        </>
                      )}
                      {form.status === 'archived' && (
                        <DropdownMenuItem onClick={() => handleReactivate(form.id)}>
                          <RotateCcw className="mr-2 size-4" />
                          {t('reactivateAction')}
                        </DropdownMenuItem>
                      )}
                      {form.status === 'draft' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(form.id)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            {t('deleteAction')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancelDelete')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('confirmDelete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
