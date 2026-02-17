'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FormStep } from '@/types/form-schema'

interface StepTabsProps {
  steps: FormStep[]
  activeStepId: string
  onSelectStep: (stepId: string) => void
  onAddStep: () => void
  onRemoveStep: (stepId: string) => void
  onRenameStep: (stepId: string, title: string) => void
}

export function StepTabs({
  steps,
  activeStepId,
  onSelectStep,
  onAddStep,
  onRemoveStep,
  onRenameStep,
}: StepTabsProps) {
  const t = useTranslations('admin.forms.builder')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEditing = (step: FormStep) => {
    setEditingId(step.id)
    setEditValue(step.title)
  }

  const finishEditing = () => {
    if (editingId && editValue.trim()) {
      onRenameStep(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="flex items-center gap-1 border-b px-3 pt-2">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            'group relative flex items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-sm transition-colors',
            step.id === activeStepId
              ? 'bg-background border-border font-medium'
              : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted cursor-pointer'
          )}
          onClick={() => onSelectStep(step.id)}
        >
          {editingId === step.id ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishEditing()
                if (e.key === 'Escape') setEditingId(null)
              }}
              className="h-5 w-24 border-none p-0 text-sm shadow-none focus-visible:ring-0"
              autoFocus
            />
          ) : (
            <span
              className="truncate"
              onDoubleClick={(e) => {
                e.stopPropagation()
                startEditing(step)
              }}
            >
              {t('stepLabel', { number: index + 1 })}: {step.title}
            </span>
          )}
          {steps.length > 1 && step.id === activeStepId && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveStep(step.id)
              }}
              className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground h-7 gap-1 text-xs"
        onClick={onAddStep}
      >
        <Plus className="size-3" />
        {t('addStep')}
      </Button>
    </div>
  )
}
