'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  deleteOrganization,
  resendOrgInvitation,
  cancelOrgInvitation,
  startImpersonationAction,
} from '../../actions'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Trash2, RefreshCw, X, Copy, Check, Eye, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  settings: unknown
  subscriptionTier: 'individual' | 'team' | 'enterprise'
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired'
  defaultLocale: 'de' | 'en' | null
  maxMembers: number | null
  maxAnalysesPerMonth: number | null
  internalNotes: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

interface OrgInvitation {
  id: string
  email: string
  targetOrgRole: 'org_admin' | 'manager' | 'member' | null
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: Date
  createdAt: Date
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'default',
  accepted: 'secondary',
  expired: 'outline',
  cancelled: 'destructive',
}

export function OrgDetailClient({
  organization,
  invitations,
  isSuperadmin,
}: {
  organization: Organization
  invitations: OrgInvitation[]
  isSuperadmin: boolean
}) {
  const t = useTranslations('admin.orgs')
  const tDetail = useTranslations('admin.orgs.detail')
  const tInvites = useTranslations('admin.orgs.invitations')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const tImpersonation = useTranslations('admin.impersonation')
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [resendLink, setResendLink] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleImpersonate() {
    const result = await startImpersonationAction(organization.id, organization.name)
    if (result.success) {
      router.push(`/${locale}/dashboard`)
    }
  }

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

  async function handleResend(invitationId: string) {
    const result = await resendOrgInvitation(invitationId)
    if (result.success && result.inviteLink) {
      setResendLink(result.inviteLink)
      setShowLinkDialog(true)
      toast.success(tInvites('resent'))
    } else {
      toast.error(result.error || t('error'))
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    const result = await cancelOrgInvitation(invitationId)
    if (result.success) {
      toast.success(tInvites('cancelled'))
    } else {
      toast.error(t('error'))
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(resendLink)
    setCopied(true)
    toast.success(tInvites('linkCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === 'pending'
  )

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/admin/organizations`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {organization.name}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              {organization.slug}
            </p>
          </div>
          {isSuperadmin && (
            <Button variant="outline" asChild>
              <Link href={`/${locale}/admin/organizations/${organization.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                {tCommon('edit')}
              </Link>
            </Button>
          )}
          {isSuperadmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="mr-2 size-4" />
                  {tImpersonation('viewAsOrg')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tImpersonation('confirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tImpersonation('confirmDescription', { orgName: organization.name })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleImpersonate}>
                    {tImpersonation('confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">{tDetail('title')}</TabsTrigger>
            <TabsTrigger value="invitations">
              {tInvites('title')}{' '}
              {pendingInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-1.5">
                  {pendingInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{tDetail('title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      {t('name')}
                    </span>
                    <span className="text-sm font-medium">
                      {organization.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      {t('slug')}
                    </span>
                    <span className="font-mono text-sm">
                      {organization.slug}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      {t('tier')}
                    </span>
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
              <Card className="border-destructive/50 mt-4">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    {tDetail('dangerZone')}
                  </CardTitle>
                  <CardDescription>
                    {tDetail('deleteWarning')}
                  </CardDescription>
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
                        <AlertDialogCancel>
                          {tCommon('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          {tCommon('delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>{tInvites('title')}</CardTitle>
                <CardDescription>{tInvites('description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {tInvites('noInvitations')}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tCommon('email')}</TableHead>
                        <TableHead>{tCommon('role')}</TableHead>
                        <TableHead>{tCommon('status')}</TableHead>
                        <TableHead>{tCommon('date')}</TableHead>
                        {isSuperadmin && (
                          <TableHead className="w-[120px]">
                            {tCommon('actions')}
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {inv.targetOrgRole || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariants[inv.status] || 'outline'}>
                              {tInvites(`status.${inv.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </TableCell>
                          {isSuperadmin && (
                            <TableCell>
                              {inv.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleResend(inv.id)}
                                    title={tInvites('resend')}
                                  >
                                    <RefreshCw className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleCancelInvitation(inv.id)
                                    }
                                    title={tInvites('cancel')}
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tInvites('linkTitle')}</DialogTitle>
            <DialogDescription>{tInvites('linkDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
              <code className="flex-1 break-all text-sm">{resendLink}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <Button onClick={() => setShowLinkDialog(false)} className="w-full">
            {tCommon('confirm')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
