'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Send, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { FormSchema, FormField, FormStep } from '@/types/form-schema'
import { useConditionalFields } from '@/hooks/use-conditional-fields'
import { createSubmissionValidator } from '@/lib/validations/forms'
import { TextField } from './fields/text-field'
import { TextareaField } from './fields/textarea-field'
import { NumberField } from './fields/number-field'
import { EmailField } from './fields/email-field'
import { PhoneField } from './fields/phone-field'
import { DateField } from './fields/date-field'
import { RadioField } from './fields/radio-field'
import { CheckboxField } from './fields/checkbox-field'
import { CsatField } from './fields/csat-field'
import { RatingField } from './fields/rating-field'
import { HiddenField } from './fields/hidden-field'

interface FormRendererProps {
  schema: FormSchema
  stepDisplayMode: 'progress_bar' | 'tabs'
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  isPreview?: boolean
  initialValues?: Record<string, unknown>
}

export function FormRenderer({
  schema,
  stepDisplayMode,
  onSubmit,
  isPreview,
  initialValues,
}: FormRendererProps) {
  const t = useTranslations('forms')
  const [currentStep, setCurrentStep] = useState(0)
  const [values, setValues] = useState<Record<string, unknown>>(initialValues ?? {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const formRef = useRef<HTMLDivElement>(null)
  const visibleFields = useConditionalFields(schema, values)

  const steps = schema.steps
  const activeStep = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const progress = steps.length > 1 ? ((currentStep + 1) / steps.length) * 100 : 100

  const setValue = useCallback((fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error on change
    setErrors((prev) => {
      if (!prev[fieldId]) return prev
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }, [])

  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const step = steps[stepIndex]
      if (!step) return true

      const stepErrors: Record<string, string> = {}

      for (const field of step.fields) {
        // Skip hidden fields and invisible fields
        if (field.type === 'hidden') continue
        if (!visibleFields.has(field.id)) continue

        const value = values[field.id]

        // Required check
        if (field.required) {
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0)
          ) {
            stepErrors[field.id] = t('validation.required')
            continue
          }
        }

        // Pattern check
        if (field.validation?.pattern && typeof value === 'string' && value) {
          try {
            const regex = new RegExp(field.validation.pattern)
            if (!regex.test(value)) {
              stepErrors[field.id] =
                field.validation.patternMessage ?? t('validation.pattern')
            }
          } catch {
            // Invalid regex, skip
          }
        }

        // Type-specific checks
        if (value !== undefined && value !== null && value !== '') {
          switch (field.config.type) {
            case 'text':
            case 'textarea': {
              const strVal = String(value)
              if (field.config.minLength && strVal.length < field.config.minLength) {
                stepErrors[field.id] = t('validation.minLength', {
                  min: field.config.minLength,
                })
              }
              if (field.config.maxLength && strVal.length > field.config.maxLength) {
                stepErrors[field.id] = t('validation.maxLength', {
                  max: field.config.maxLength,
                })
              }
              break
            }
            case 'number': {
              const numVal = Number(value)
              if (field.config.min !== undefined && numVal < field.config.min) {
                stepErrors[field.id] = t('validation.min', {
                  min: field.config.min,
                })
              }
              if (field.config.max !== undefined && numVal > field.config.max) {
                stepErrors[field.id] = t('validation.max', {
                  max: field.config.max,
                })
              }
              break
            }
            case 'email': {
              if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                stepErrors[field.id] = t('validation.email')
              }
              break
            }
            case 'checkbox': {
              if (Array.isArray(value)) {
                if (field.config.minSelections && value.length < field.config.minSelections) {
                  stepErrors[field.id] = t('validation.minSelections', {
                    min: field.config.minSelections,
                  })
                }
                if (field.config.maxSelections && value.length > field.config.maxSelections) {
                  stepErrors[field.id] = t('validation.maxSelections', {
                    max: field.config.maxSelections,
                  })
                }
              }
              break
            }
          }
        }
      }

      setErrors((prev) => {
        // Clear previous errors for this step's fields
        const next = { ...prev }
        for (const field of step.fields) {
          delete next[field.id]
        }
        return { ...next, ...stepErrors }
      })

      if (Object.keys(stepErrors).length > 0) {
        // Scroll to first error
        const firstErrorField = step.fields.find((f) => stepErrors[f.id])
        if (firstErrorField && formRef.current) {
          const el = formRef.current.querySelector(`[data-field-id="${firstErrorField.id}"]`)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return false
      }

      return true
    },
    [steps, values, visibleFields, t]
  )

  const goToNext = useCallback(() => {
    if (!validateStep(currentStep)) return

    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setSlideDirection('right')
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }, [currentStep, steps.length, validateStep])

  const goToPrev = useCallback(() => {
    setSlideDirection('left')
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleSubmit = useCallback(async () => {
    // Validate all steps
    let hasErrors = false
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        if (!hasErrors) {
          setCurrentStep(i)
          hasErrors = true
        }
      }
    }

    if (hasErrors) return
    if (isPreview) return

    // Build submission data (only visible + hidden fields)
    const submissionData: Record<string, unknown> = {}
    for (const step of steps) {
      for (const field of step.fields) {
        if (field.type === 'hidden' || visibleFields.has(field.id)) {
          submissionData[field.id] = values[field.id] ?? undefined
        }
      }
    }

    setSubmitting(true)
    try {
      await onSubmit(submissionData)
    } catch {
      // Error handled by parent
    } finally {
      setSubmitting(false)
    }
  }, [steps, validateStep, isPreview, visibleFields, values, onSubmit])

  // Keyboard: Enter to advance
  useEffect(() => {
    if (stepDisplayMode !== 'progress_bar') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        if (isLastStep) {
          handleSubmit()
        } else {
          goToNext()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [stepDisplayMode, isLastStep, handleSubmit, goToNext])

  const renderField = (field: FormField) => {
    if (!visibleFields.has(field.id) && field.type !== 'hidden') return null

    const fieldError = errors[field.id]
    const commonProps = { field, error: fieldError, disabled: isPreview }

    switch (field.type) {
      case 'text':
        return (
          <TextField
            {...commonProps}
            value={(values[field.id] as string) ?? ''}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'textarea':
        return (
          <TextareaField
            {...commonProps}
            value={(values[field.id] as string) ?? ''}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'number':
        return (
          <NumberField
            {...commonProps}
            value={(values[field.id] as number | '') ?? ''}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'email':
        return (
          <EmailField
            {...commonProps}
            value={(values[field.id] as string) ?? ''}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'phone':
        return (
          <PhoneField
            {...commonProps}
            value={(values[field.id] as string) ?? ''}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'date':
        return (
          <DateField
            {...commonProps}
            value={(values[field.id] as string) ?? ''}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'radio':
        return (
          <RadioField
            {...commonProps}
            value={(values[field.id] as string) ?? ''}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'checkbox':
        return (
          <CheckboxField
            {...commonProps}
            value={(values[field.id] as string[]) ?? []}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'csat':
        return (
          <CsatField
            {...commonProps}
            value={(values[field.id] as number) ?? null}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'rating':
        return (
          <RatingField
            {...commonProps}
            value={(values[field.id] as number) ?? null}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      case 'hidden':
        return (
          <HiddenField
            field={field}
            value={(values[field.id] as string) ?? ''}
            onChange={(v) => setValue(field.id, v)}
          />
        )
      default:
        return null
    }
  }

  // ─── Progress Bar Mode (Typeform-style) ───
  if (stepDisplayMode === 'progress_bar') {
    return (
      <div ref={formRef} className="flex min-h-[70vh] flex-col">
        {/* Progress bar */}
        {steps.length > 1 && (
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Step content */}
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div
            key={currentStep}
            className={cn(
              'w-full max-w-[640px] animate-in fade-in duration-300',
              slideDirection === 'right'
                ? 'slide-in-from-right-4'
                : 'slide-in-from-left-4'
            )}
          >
            {/* Step header */}
            {(activeStep.title || activeStep.description) && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold">{activeStep.title}</h2>
                {activeStep.description && (
                  <p className="text-muted-foreground mt-2">{activeStep.description}</p>
                )}
              </div>
            )}

            {/* Fields */}
            <div className="space-y-6">
              {activeStep.fields.map((field) => (
                <div key={field.id} data-field-id={field.id}>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button
            variant="ghost"
            onClick={goToPrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 size-4" />
            {t('back')}
          </Button>

          {steps.length > 1 && (
            <span className="text-muted-foreground text-sm">
              {t('stepOf', { current: currentStep + 1, total: steps.length })}
            </span>
          )}

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={submitting || isPreview}>
              {submitting ? t('submitting') : t('submit')}
              <Send className="ml-2 size-4" />
            </Button>
          ) : (
            <Button onClick={goToNext}>
              {t('next')}
              <ChevronRight className="ml-2 size-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ─── Tabs Mode (Classic) ───
  return (
    <div ref={formRef} className="mx-auto max-w-2xl">
      {/* Step tabs */}
      {steps.length > 1 && (
        <div className="mb-8 flex gap-1 overflow-x-auto border-b">
          {steps.map((step, i) => {
            const isCompleted = completedSteps.has(i)
            const isCurrent = i === currentStep
            const canAccess = i <= currentStep || isCompleted

            return (
              <button
                key={step.id}
                type="button"
                disabled={!canAccess}
                onClick={() => canAccess && setCurrentStep(i)}
                className={cn(
                  'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  isCurrent
                    ? 'border-primary text-primary'
                    : isCompleted
                      ? 'text-muted-foreground border-transparent hover:text-foreground'
                      : 'text-muted-foreground/50 cursor-not-allowed border-transparent'
                )}
              >
                {isCompleted ? (
                  <Check className="text-primary size-4" />
                ) : (
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>
                )}
                {step.title}
              </button>
            )
          })}
        </div>
      )}

      {/* Step content */}
      <div
        key={currentStep}
        className="animate-in fade-in duration-200"
      >
        {activeStep.description && (
          <p className="text-muted-foreground mb-6">{activeStep.description}</p>
        )}

        <div className="space-y-6">
          {activeStep.fields.map((field) => (
            <div key={field.id} data-field-id={field.id}>
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={goToPrev}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 size-4" />
          {t('back')}
        </Button>

        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={submitting || isPreview}>
            {submitting ? t('submitting') : t('submit')}
            <Send className="ml-2 size-4" />
          </Button>
        ) : (
          <Button onClick={goToNext}>
            {t('next')}
            <ChevronRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
