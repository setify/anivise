'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { FormRenderer } from '@/components/forms/form-renderer'
import { FormCompletion } from '@/components/forms/form-completion'
import { submitForm } from '../actions'
import type { FormSchema } from '@/types/form-schema'
import type { Form, FormVersion } from '@/types/database'

interface FormPageClientProps {
  form: Form
  version: FormVersion
  schema: FormSchema
  existingSubmission: { id: string; submittedAt: Date } | null
}

export function FormPageClient({
  form,
  version,
  schema,
  existingSubmission,
}: FormPageClientProps) {
  const t = useTranslations('forms')
  const [completed, setCompleted] = useState(false)
  const loadedAtRef = useRef(Date.now())

  const handleSubmit = async (data: Record<string, unknown>) => {
    const duration = Math.round((Date.now() - loadedAtRef.current) / 1000)

    const result = await submitForm({
      formId: form.id,
      formVersionId: version.id,
      data,
      metadata: {
        duration,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
    })

    if (!result.success) {
      toast.error(result.error ?? t('submitError'), { className: 'rounded-full' })
      throw new Error(result.error)
    }

    setCompleted(true)
  }

  if (completed) {
    return (
      <FormCompletion
        type={form.completionType as 'thank_you' | 'redirect'}
        title={form.completionTitle}
        message={form.completionMessage}
        redirectUrl={form.completionRedirectUrl}
      />
    )
  }

  if (existingSubmission) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold">{t('alreadySubmitted')}</h2>
          <p className="text-muted-foreground mt-2">
            {t('submittedOn', {
              date: new Date(existingSubmission.submittedAt).toLocaleDateString(),
            })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="mx-auto mb-6 max-w-2xl px-4">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && (
          <p className="text-muted-foreground mt-1">{form.description}</p>
        )}
      </div>
      <FormRenderer
        schema={schema}
        stepDisplayMode={form.stepDisplayMode as 'progress_bar' | 'tabs'}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
