'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, XCircle, Clock, Link as LinkIcon } from 'lucide-react'
import {
  type InviteValidationResult,
  type InvitationInfo,
  acceptInvitation,
  registerAndAcceptInvitation,
} from './actions'

interface InviteClientProps {
  result: InviteValidationResult
  token: string
  locale: string
}

export function InviteClient({ result, token, locale }: InviteClientProps) {
  const t = useTranslations('auth.invite')
  const router = useRouter()

  if (!result.valid) {
    return <InvalidInvitation error={result.error} locale={locale} />
  }

  if (result.isLoggedIn) {
    return (
      <AcceptInvitation
        invitation={result.invitation}
        token={token}
        locale={locale}
      />
    )
  }

  return (
    <RegisterOrLogin
      invitation={result.invitation}
      token={token}
      locale={locale}
    />
  )
}

function InvalidInvitation({
  error,
  locale,
}: {
  error: 'not_found' | 'expired' | 'already_used' | 'cancelled'
  locale: string
}) {
  const t = useTranslations('auth.invite')

  const errorConfig = {
    not_found: { icon: XCircle, color: 'text-red-500' },
    expired: { icon: Clock, color: 'text-amber-500' },
    already_used: { icon: CheckCircle2, color: 'text-blue-500' },
    cancelled: { icon: XCircle, color: 'text-red-500' },
  }

  const { icon: Icon, color } = errorConfig[error]

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
        <Icon className={`size-12 ${color}`} />
        <h2 className="text-lg font-semibold">{t(`errors.${error}.title`)}</h2>
        <p className="text-muted-foreground text-sm">
          {t(`errors.${error}.description`)}
        </p>
        <Button variant="outline" asChild>
          <a href={`/${locale}/login`}>{t('backToLogin')}</a>
        </Button>
      </CardContent>
    </Card>
  )
}

function AcceptInvitation({
  invitation,
  token,
  locale,
}: {
  invitation: InvitationInfo
  token: string
  locale: string
}) {
  const t = useTranslations('auth.invite')
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const roleLabel =
    invitation.invitationType === 'platform'
      ? invitation.role
      : invitation.targetOrgRole

  async function handleAccept() {
    setIsPending(true)
    const result = await acceptInvitation(token)

    if (result.success && result.redirectTo) {
      toast.success(t('accepted'))
      router.push(`/${locale}${result.redirectTo}`)
    } else {
      toast.error(t('acceptError'))
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          {invitation.inviterName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('invitedBy')}</span>
              <span className="font-medium">{invitation.inviterName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('role')}</span>
            <Badge variant="secondary">{roleLabel}</Badge>
          </div>
          {invitation.organizationName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('organization')}</span>
              <span className="font-medium">{invitation.organizationName}</span>
            </div>
          )}
        </div>

        <Button
          className="w-full"
          onClick={handleAccept}
          disabled={isPending}
        >
          {isPending ? t('accepting') : t('accept')}
        </Button>
      </CardContent>
    </Card>
  )
}

function RegisterOrLogin({
  invitation,
  token,
  locale,
}: {
  invitation: InvitationInfo
  token: string
  locale: string
}) {
  const t = useTranslations('auth.invite')
  const router = useRouter()
  const [mode, setMode] = useState<'choice' | 'register'>('choice')
  const [isPending, setIsPending] = useState(false)

  const roleLabel =
    invitation.invitationType === 'platform'
      ? invitation.role
      : invitation.targetOrgRole

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const fullName = formData.get('fullName') as string
    const password = formData.get('password') as string

    const result = await registerAndAcceptInvitation(token, {
      fullName,
      password,
    })

    if (result.success && result.redirectTo) {
      toast.success(t('accepted'))
      router.push(`/${locale}${result.redirectTo}`)
    } else {
      toast.error(result.error || t('acceptError'))
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('email')}</span>
            <span className="font-medium">{invitation.email}</span>
          </div>
          {invitation.inviterName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('invitedBy')}</span>
              <span className="font-medium">{invitation.inviterName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('role')}</span>
            <Badge variant="secondary">{roleLabel}</Badge>
          </div>
          {invitation.organizationName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('organization')}</span>
              <span className="font-medium">{invitation.organizationName}</span>
            </div>
          )}
        </div>

        {mode === 'choice' ? (
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => setMode('register')}
            >
              {t('createAccount')}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <a
                href={`/${locale}/login?redirectTo=/${locale}/invite/${token}`}
              >
                {t('alreadyHaveAccount')}
              </a>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('fullName')}</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                placeholder={t('fullNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder={t('passwordPlaceholder')}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setMode('choice')}
                disabled={isPending}
              >
                {t('back')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? t('registering') : t('registerAndAccept')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
