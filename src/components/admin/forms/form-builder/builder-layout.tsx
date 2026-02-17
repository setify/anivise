'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { toast } from 'sonner'
import type { FormSchema } from '@/types/form-schema'
import type { Form } from '@/types/database'
import { useBuilderState } from './use-builder-state'
import { createDefaultField, FIELD_TYPE_DEFINITIONS } from './builder-types'
import { FieldPalette } from './field-palette'
import { BuilderCanvas } from './builder-canvas'
import { FieldSettings } from './field-settings'
import { BuilderToolbar } from './builder-toolbar'
import { BuilderPreview } from './builder-preview'
import {
  saveFormSchema,
  saveFormVersion,
  publishForm,
  updateFormMeta,
} from '@/app/[locale]/(superadmin)/admin/forms/actions'

interface BuilderLayoutProps {
  form: Form
  initialSchema: FormSchema
}

export function BuilderLayout({ form, initialSchema }: BuilderLayoutProps) {
  const t = useTranslations('admin.forms.builder')
  const locale = useLocale()
  const { state, dispatch, activeStep, selectedField, hasUnsavedChanges, markSaved } =
    useBuilderState(initialSchema)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [title, setTitle] = useState(form.title)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // Auto-save with debounce
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setSaveStatus('saved')
      return
    }
    setSaveStatus('unsaved')

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      const result = await saveFormSchema(form.id, state.schema)
      if (result.success) {
        markSaved()
        setSaveStatus('saved')
      }
    }, 3000)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [state.schema, hasUnsavedChanges, form.id, markSaved])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // Dragging from palette → canvas
    if (activeData?.type === 'palette') {
      const fieldType = activeData.fieldType
      const newField = createDefaultField(fieldType)
      const stepId = overData?.stepId ?? state.activeStepId

      // Determine insertion index
      let index = activeStep?.fields.length ?? 0
      if (overData?.type === 'canvas-field') {
        const overIndex = activeStep?.fields.findIndex((f) => f.id === over.id) ?? -1
        if (overIndex !== -1) index = overIndex
      }

      dispatch({ type: 'ADD_FIELD', stepId, field: newField, index })
      return
    }

    // Reordering within canvas
    if (activeData?.type === 'canvas-field' && active.id !== over.id) {
      const stepId = activeData.stepId
      dispatch({
        type: 'REORDER_FIELDS',
        stepId,
        activeId: String(active.id),
        overId: String(over.id),
      })
    }
  }

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    const result = await saveFormVersion(form.id, state.schema)
    if (result.success) {
      markSaved()
      setSaveStatus('saved')
      toast.success(t('saved'), { className: 'rounded-full' })
    } else {
      toast.error(result.error ?? t('saveError'), { className: 'rounded-full' })
    }
  }, [form.id, state.schema, markSaved, t])

  const handlePublish = useCallback(async () => {
    // Save first
    await saveFormSchema(form.id, state.schema)
    const result = await publishForm(form.id)
    if (result.success) {
      toast.success(t('published'), { className: 'rounded-full' })
    } else {
      toast.error(result.error ?? t('publishError'), { className: 'rounded-full' })
    }
  }, [form.id, state.schema, t])

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle)
      updateFormMeta(form.id, { title: newTitle })
    },
    [form.id]
  )

  const handleSettings = useCallback(() => {
    // For now, just show a toast. Settings modal will be added later.
    toast.info(t('settingsHint'), { className: 'rounded-full' })
  }, [t])

  return (
    <div className="flex h-screen flex-col">
      <BuilderToolbar
        formId={form.id}
        title={title}
        onTitleChange={handleTitleChange}
        onSave={handleSave}
        onPublish={handlePublish}
        onPreview={() => setPreviewOpen(true)}
        onSettings={handleSettings}
        saveStatus={saveStatus}
        locale={locale}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1">
          <FieldPalette />

          <BuilderCanvas
            steps={state.schema.steps}
            activeStepId={state.activeStepId}
            selectedFieldId={state.selectedFieldId}
            dispatch={dispatch}
          />

          <FieldSettings
            field={selectedField}
            stepId={state.activeStepId}
            allFields={activeStep?.fields ?? []}
            dispatch={dispatch}
          />
        </div>

        <DragOverlay>
          {activeDragId && activeDragId.startsWith('palette-') && (
            <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
              {(() => {
                const type = activeDragId.replace('palette-', '')
                const def = FIELD_TYPE_DEFINITIONS.find((d) => d.type === type)
                return (
                  <span className="flex items-center gap-2">
                    <span>{def?.icon}</span>
                    <span>{t(`fieldNames.${def?.labelKey ?? type}`)}</span>
                  </span>
                )
              })()}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <BuilderPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        schema={state.schema}
        formTitle={title}
      />
    </div>
  )
}
