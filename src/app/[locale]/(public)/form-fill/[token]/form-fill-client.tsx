'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { FormRenderer } from '@/components/forms/form-renderer'
import { FormCompletion } from '@/components/forms/form-completion'
import { submitFormViaToken } from './actions'
import type { TokenFormData } from './actions'
import type { FormSchema } from '@/types/form-schema'

interface FormFillClientProps {
  token: string
  formData: TokenFormData
}

export function FormFillClient({ token, formData }: FormFillClientProps) {
  const t = useTranslations('formFill')
  const [completed, setCompleted] = useState(false)
  const [completionData, setCompletionData] = useState<{
    type: 'thank_you' | 'redirect'
    title?: string | null
    message?: string | null
    redirectUrl?: string | null
  } | null>(null)
  const loadedAtRef = useRef(Date.now())

  const { form, schema, branding } = formData

  const handleSubmit = async (data: Record<string, unknown>) => {
    const duration = Math.round((Date.now() - loadedAtRef.current) / 1000)

    const result = await submitFormViaToken(token, data, {
      duration,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    })

    if (!result.success) {
      toast.error(t('submitError'))
      throw new Error(result.error)
    }

    setCompletionData({
      type: (result.completionType as 'thank_you' | 'redirect') ?? 'thank_you',
      title: result.completionTitle,
      message: result.completionMessage,
      redirectUrl: result.completionRedirectUrl,
    })
    setCompleted(true)
  }

  if (completed && completionData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        {branding.logoUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={branding.logoUrl}
              alt={branding.organizationName}
              className="h-10 object-contain"
            />
          </div>
        )}
        <FormCompletion
          type={completionData.type}
          title={completionData.title}
          message={completionData.message}
          redirectUrl={completionData.redirectUrl}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Org branding header */}
      <div className="mb-8 text-center">
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.organizationName}
            className="mx-auto mb-4 h-10 object-contain"
          />
        ) : (
          <h2
            className="mb-4 text-lg font-semibold"
            style={branding.primaryColor ? { color: branding.primaryColor } : undefined}
          >
            {branding.organizationName}
          </h2>
        )}
      </div>

      {/* Form title + description */}
      <div className="mx-auto mb-6 max-w-2xl px-4">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && (
          <p className="text-muted-foreground mt-1">{form.description}</p>
        )}
      </div>

      {/* Form renderer */}
      <FormRenderer
        schema={schema as unknown as FormSchema}
        stepDisplayMode={form.stepDisplayMode as 'progress_bar' | 'tabs'}
        onSubmit={handleSubmit}
      />

      {/* Powered by footer */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground text-xs">
          {t('poweredBy')} <span className="font-medium">Anivise</span>
        </p>
      </div>
    </div>
  )
}
