'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteOrganization } from '../../actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  settings: unknown
  subscriptionTier: 'individual' | 'team' | 'enterprise'
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired'
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export function OrgDetailClient({
  organization,
  isSuperadmin,
}: {
  organization: Organization
  isSuperadmin: boolean
}) {
  const t = useTranslations('admin.orgs')
  const tDetail = useTranslations('admin.orgs.detail')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  async function handleDelete() {
    const formData = new FormData()
    formData.set('organizationId', organization.id)
    const result = await deleteOrganization(formData)
    if (result.success) {
      toast.success(t('orgDeleted'))
      router.push(`/${locale}/admin/organizations`)
    } else {
      toast.error(result.error || t('error'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/organizations`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {organization.name}
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {organization.slug}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tDetail('title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">{t('name')}</span>
              <span className="text-sm font-medium">{organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">{t('slug')}</span>
              <span className="font-mono text-sm">{organization.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">{t('tier')}</span>
              <Badge variant="secondary">
                {t(
                  organization.subscriptionTier === 'team'
                    ? 'teamTier'
                    : organization.subscriptionTier
                )}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {t('tierStatus')}
              </span>
              <Badge variant="outline">
                {t(organization.subscriptionStatus)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {t('created')}
              </span>
              <span className="text-sm">
                {new Date(organization.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {isSuperadmin && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">
              {tDetail('dangerZone')}
            </CardTitle>
            <CardDescription>{tDetail('deleteWarning')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 size-4" />
                  {tDetail('deleteOrg')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {tDetail('deleteConfirm')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {tDetail('deleteWarning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {tCommon('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
