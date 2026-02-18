'use client'

import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { FormStep } from '@/types/form-schema'
import type { BuilderAction } from './builder-types'
import { CanvasField } from './canvas-field'
import { CanvasEmptyState } from './canvas-empty-state'
import { StepTabs } from './step-tabs'

interface BuilderCanvasProps {
  steps: FormStep[]
  activeStepId: string
  selectedFieldId: string | null
  dispatch: React.Dispatch<BuilderAction>
}

export function BuilderCanvas({
  steps,
  activeStepId,
  selectedFieldId,
  dispatch,
}: BuilderCanvasProps) {
  const activeStep = steps.find((s) => s.id === activeStepId)
  const fields = activeStep?.fields ?? []

  const { setNodeRef, isOver } = useDroppable({
    id: `canvas-${activeStepId}`,
    data: { type: 'canvas', stepId: activeStepId },
  })

  const handleAddStep = () => {
    dispatch({
      type: 'ADD_STEP',
      step: {
        id: crypto.randomUUID(),
        title: `Step ${steps.length + 1}`,
        fields: [],
      },
    })
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col" onClick={() => dispatch({ type: 'SELECT_FIELD', fieldId: null })}>
      <StepTabs
        steps={steps}
        activeStepId={activeStepId}
        onSelectStep={(id) => dispatch({ type: 'SET_ACTIVE_STEP', stepId: id })}
        onAddStep={handleAddStep}
        onRemoveStep={(id) => dispatch({ type: 'REMOVE_STEP', stepId: id })}
        onRenameStep={(id, title) =>
          dispatch({ type: 'UPDATE_STEP', stepId: id, updates: { title } })
        }
      />

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto p-6',
          'bg-muted/50 bg-[radial-gradient(circle,_hsl(var(--muted-foreground)/0.1)_1px,_transparent_1px)] [background-size:20px_20px]',
          isOver && 'bg-primary/5'
        )}
      >
        {fields.length === 0 ? (
          <CanvasEmptyState stepId={activeStepId} />
        ) : (
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="mx-auto max-w-2xl space-y-3">
              {fields.map((field) => (
                <CanvasField
                  key={field.id}
                  field={field}
                  stepId={activeStepId}
                  isSelected={selectedFieldId === field.id}
                  onSelect={() =>
                    dispatch({ type: 'SELECT_FIELD', fieldId: field.id })
                  }
                  onRemove={() =>
                    dispatch({
                      type: 'REMOVE_FIELD',
                      stepId: activeStepId,
                      fieldId: field.id,
                    })
                  }
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  )
}
