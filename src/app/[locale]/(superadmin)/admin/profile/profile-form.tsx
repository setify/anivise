'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { updateProfile } from '../actions'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ProfileUser {
  id: string
  email: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  phone: string | null
  timezone: string | null
  avatarUrl: string | null
  avatarStoragePath: string | null
  platformRole: 'superadmin' | 'staff' | null
  preferredLocale: 'de' | 'en'
}

async function handleSubmit(
  _prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  const result = await updateProfile(formData)
  return result
}

export function ProfileForm({ user }: { user: ProfileUser }) {
  const t = useTranslations('admin.profile')
  const tCommon = useTranslations('common')
  const tTeam = useTranslations('admin.team')
  const [state, formAction, isPending] = useActionState(handleSubmit, null)

  if (state?.success) {
    toast.success(t('saved'))
  } else if (state && !state.success) {
    toast.error(t('error'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {user.platformRole && (
          <Badge variant="secondary">
            {tTeam(`roles.${user.platformRole}`)}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('firstName')}</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={user.firstName || ''}
                  placeholder={t('firstName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('lastName')}</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={user.lastName || ''}
                  placeholder={t('lastName')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">{t('displayName')}</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={user.displayName || ''}
                placeholder={t('displayName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={user.phone || ''}
                  placeholder={t('phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">{t('timezone')}</Label>
                <Input
                  id="timezone"
                  name="timezone"
                  defaultValue={user.timezone || 'Europe/Berlin'}
                  placeholder="Europe/Berlin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredLocale">{t('locale')}</Label>
              <Select
                name="preferredLocale"
                defaultValue={user.preferredLocale}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? tCommon('saving') : tCommon('save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
