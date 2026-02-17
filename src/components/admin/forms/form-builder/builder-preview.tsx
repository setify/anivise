'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { FormSchema } from '@/types/form-schema'

interface BuilderPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schema: FormSchema
  formTitle: string
}

export function BuilderPreview({
  open,
  onOpenChange,
  schema,
  formTitle,
}: BuilderPreviewProps) {
  const t = useTranslations('admin.forms.builder')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {schema.steps.map((step, stepIndex) => (
            <div key={step.id}>
              {schema.steps.length > 1 && (
                <h3 className="mb-4 text-lg font-semibold">
                  {t('stepLabel', { number: stepIndex + 1 })}: {step.title}
                </h3>
              )}
              <div className="space-y-4">
                {step.fields.map((field) => {
                  if (field.type === 'hidden') return null

                  return (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      {field.description && (
                        <p className="text-muted-foreground text-xs">{field.description}</p>
                      )}

                      {/* Render preview based on type */}
                      {(field.type === 'text' || field.type === 'email' || field.type === 'phone') && (
                        <Input
                          placeholder={field.placeholder}
                          disabled
                          type={field.type === 'email' ? 'email' : 'text'}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <textarea
                          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm opacity-50"
                          placeholder={field.placeholder}
                          rows={(field.config as { rows?: number }).rows ?? 4}
                          disabled
                        />
                      )}

                      {field.type === 'number' && (
                        <Input
                          type="number"
                          placeholder={field.placeholder}
                          disabled
                        />
                      )}

                      {field.type === 'date' && (
                        <Input type="date" disabled />
                      )}

                      {field.type === 'radio' && field.config.type === 'radio' && (
                        <div className="space-y-2">
                          {field.config.options.map((option) => (
                            <label key={option.id} className="flex items-center gap-2 text-sm">
                              <input type="radio" name={field.id} disabled />
                              {option.label}
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'checkbox' && field.config.type === 'checkbox' && (
                        <div className="space-y-2">
                          {field.config.options.map((option) => (
                            <label key={option.id} className="flex items-center gap-2 text-sm">
                              <input type="checkbox" disabled />
                              {option.label}
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'csat' && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 10 }, (_, i) => (
                            <button
                              key={i}
                              className="bg-muted size-8 rounded border text-xs"
                              disabled
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}

                      {field.type === 'rating' && (
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className="text-muted-foreground text-2xl">
                              ☆
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <Button disabled className="w-full">
            {t('submitPreview')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
