'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef, useState } from 'react'
import { updateUserProfile, uploadUserAvatar, removeUserAvatar } from './actions'
import type { ProfileUser } from './actions'
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
  return updateUserProfile(formData)
}

function getInitials(user: ProfileUser): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  if (user.fullName) {
    const parts = user.fullName.split(' ')
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }
  return user.email[0].toUpperCase()
}

export function ProfileClient({ user }: { user: ProfileUser }) {
  const t = useTranslations('org.settings.profile')
  const tCommon = useTranslations('common')
  const [state, formAction, isPending] = useActionState(handleSubmit, null)
  const prevState = useRef(state)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.set('avatar', file)
      const result = await uploadUserAvatar(formData)
      if (result.success && result.avatarUrl) {
        setAvatarUrl(result.avatarUrl)
        toast.success(t('avatarUpdated'))
      } else {
        toast.error(result.error || t('avatarError'))
      }
    } catch {
      toast.error(t('avatarError'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleRemoveAvatar() {
    setUploading(true)
    try {
      const result = await removeUserAvatar()
      if (result.success) {
        setAvatarUrl(null)
        toast.success(t('avatarRemoved'))
      } else {
        toast.error(result.error || t('avatarError'))
      }
    } catch {
      toast.error(t('avatarError'))
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (state === prevState.current) return
    prevState.current = state

    if (state?.success) {
      toast.success(t('saved'))
    } else if (state && !state.success) {
      toast.error(t('error'))
    }
  }, [state, t])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Avatar section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
              {getInitials(user)}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? t('avatarUploading') : t('avatarUpload')}
            </Button>
            {avatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={uploading}
              >
                {t('avatarRemove')}
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">{t('avatarHint')}</p>
        </div>
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
