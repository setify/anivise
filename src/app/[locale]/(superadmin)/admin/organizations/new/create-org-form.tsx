'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { createOrganization } from '../../actions'
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
import { toast } from 'sonner'

async function handleSubmit(
  _prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  const result = await createOrganization(formData)
  return result
}

export function CreateOrganizationForm() {
  const t = useTranslations('admin.orgs')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(handleSubmit, null)

  if (state?.success) {
    toast.success(t('orgCreated'))
    router.push(`/${locale}/admin/organizations`)
  } else if (state && !state.success) {
    toast.error(state.error || t('error'))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('createOrg')}</h1>
        <p className="text-muted-foreground">{t('createDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('createOrg')}</CardTitle>
          <CardDescription>{t('createDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
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
              <p className="text-muted-foreground text-xs">{t('slugHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionTier">{t('tier')}</Label>
              <Select name="subscriptionTier" defaultValue="individual">
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
  )
}
