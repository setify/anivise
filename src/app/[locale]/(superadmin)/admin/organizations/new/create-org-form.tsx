'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'
import { createOrganizationWithAdmin } from '../../actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'

async function handleSubmit(
  _prevState: {
    success: boolean
    error?: string
    inviteLink?: string
  } | null,
  formData: FormData
) {
  const result = await createOrganizationWithAdmin(formData)
  return result
}

export function CreateOrganizationForm() {
  const t = useTranslations('admin.orgs')
  const tCreate = useTranslations('admin.orgs.create')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(handleSubmit, null)
  const prevState = useRef(state)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (state === prevState.current) return
    prevState.current = state

    if (state?.success) {
      toast.success(t('orgCreated'))
      if (state.inviteLink) {
        setInviteLink(state.inviteLink)
        setShowLinkDialog(true)
      } else {
        router.push(`/${locale}/admin/organizations`)
      }
    } else if (state && !state.success) {
      toast.error(state.error || t('error'))
    }
  }, [state, t, router, locale])

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success(tCreate('linkCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCloseDialog() {
    setShowLinkDialog(false)
    router.push(`/${locale}/admin/organizations`)
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('createOrg')}
          </h1>
          <p className="text-muted-foreground">{t('createDescription')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('createOrg')}</CardTitle>
            <CardDescription>{t('createDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">{t('slug')}</Label>
                  <Input
                    id="slug"
                    name="slug"
                    required
                    placeholder="acme-corp"
                    pattern="^[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
                  />
                  <p className="text-muted-foreground text-xs">
                    {t('slugHelp')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscriptionTier">{t('tier')}</Label>
                  <Select name="subscriptionTier" defaultValue="team">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">
                        {t('individual')}
                      </SelectItem>
                      <SelectItem value="team">{t('teamTier')}</SelectItem>
                      <SelectItem value="enterprise">
                        {t('enterprise')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-base font-semibold mb-1">
                  {tCreate('adminSection')}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {tCreate('adminHint')}
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">
                      {tCreate('adminEmail')} *
                    </Label>
                    <Input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      required
                      placeholder="admin@acme-corp.com"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="adminFirstName">
                        {tCreate('adminFirstName')}
                      </Label>
                      <Input
                        id="adminFirstName"
                        name="adminFirstName"
                        placeholder={tCreate('adminFirstNamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminLastName">
                        {tCreate('adminLastName')}
                      </Label>
                      <Input
                        id="adminLastName"
                        name="adminLastName"
                        placeholder={tCreate('adminLastNamePlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? tCommon('saving') : tCommon('create')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showLinkDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCreate('inviteLinkTitle')}</DialogTitle>
            <DialogDescription>
              {tCreate('inviteLinkDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
              <code className="flex-1 break-all text-sm">{inviteLink}</code>
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
            <p className="text-muted-foreground text-xs">
              {tCreate('inviteLinkExpiry')}
            </p>
          </div>
          <Button onClick={handleCloseDialog} className="w-full">
            {tCommon('confirm')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
