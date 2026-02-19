import { getTranslations } from 'next-intl/server'
import { getFormByToken } from './actions'
import { FormFillClient } from './form-fill-client'
import { AlertCircle, Clock, CheckCircle } from 'lucide-react'

interface Props {
  params: Promise<{ token: string; locale: string }>
}

export default async function FormFillPage({ params }: Props) {
  const { token, locale } = await params
  const t = await getTranslations('formFill')

  const result = await getFormByToken(token)

  if ('error' in result) {
    const errorConfig = {
      invalid: {
        icon: AlertCircle,
        title: t('invalid.title'),
        description: t('invalid.description'),
        color: 'text-red-500',
      },
      expired: {
        icon: Clock,
        title: t('expired.title'),
        description: t('expired.description'),
        color: 'text-amber-500',
      },
      already_completed: {
        icon: CheckCircle,
        title: t('alreadyCompleted.title'),
        description: t('alreadyCompleted.description'),
        color: 'text-green-500',
      },
    }

    const config = errorConfig[result.error]
    const Icon = config.icon

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Icon className={`size-8 ${config.color}`} />
          </div>
          <h1 className="text-xl font-bold">{config.title}</h1>
          <p className="text-muted-foreground mt-2">{config.description}</p>
        </div>
      </div>
    )
  }

  return (
    <FormFillClient
      token={token}
      formData={result.data}
    />
  )
}
