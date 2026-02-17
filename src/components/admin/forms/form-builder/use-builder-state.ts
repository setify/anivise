import { useReducer, useCallback, useRef, useEffect } from 'react'
import type { FormSchema, FormField, FormStep } from '@/types/form-schema'
import type { BuilderAction, BuilderState } from './builder-types'

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'SET_SCHEMA': {
      const activeStepId = action.schema.steps[0]?.id ?? state.activeStepId
      return { ...state, schema: action.schema, activeStepId, selectedFieldId: null }
    }

    case 'ADD_FIELD': {
      const schema = { ...state.schema }
      schema.steps = schema.steps.map((step) => {
        if (step.id !== action.stepId) return step
        const fields = [...step.fields]
        fields.splice(action.index, 0, action.field)
        return { ...step, fields }
      })
      return { ...state, schema, selectedFieldId: action.field.id }
    }

    case 'REMOVE_FIELD': {
      const schema = { ...state.schema }
      schema.steps = schema.steps.map((step) => {
        if (step.id !== action.stepId) return step
        return { ...step, fields: step.fields.filter((f) => f.id !== action.fieldId) }
      })
      const selectedFieldId = state.selectedFieldId === action.fieldId ? null : state.selectedFieldId
      return { ...state, schema, selectedFieldId }
    }

    case 'UPDATE_FIELD': {
      const schema = { ...state.schema }
      schema.steps = schema.steps.map((step) => {
        if (step.id !== action.stepId) return step
        return {
          ...step,
          fields: step.fields.map((f) =>
            f.id === action.fieldId ? { ...f, ...action.updates } : f
          ),
        }
      })
      return { ...state, schema }
    }

    case 'REORDER_FIELDS': {
      const schema = { ...state.schema }
      schema.steps = schema.steps.map((step) => {
        if (step.id !== action.stepId) return step
        const fields = [...step.fields]
        const activeIndex = fields.findIndex((f) => f.id === action.activeId)
        const overIndex = fields.findIndex((f) => f.id === action.overId)
        if (activeIndex === -1 || overIndex === -1) return step
        const [moved] = fields.splice(activeIndex, 1)
        fields.splice(overIndex, 0, moved)
        return { ...step, fields }
      })
      return { ...state, schema }
    }

    case 'MOVE_FIELD_TO_STEP': {
      const schema = { ...state.schema }
      let movedField: FormField | undefined
      schema.steps = schema.steps.map((step) => {
        if (step.id === action.fromStepId) {
          movedField = step.fields.find((f) => f.id === action.fieldId)
          return { ...step, fields: step.fields.filter((f) => f.id !== action.fieldId) }
        }
        return step
      })
      if (movedField) {
        schema.steps = schema.steps.map((step) => {
          if (step.id !== action.toStepId) return step
          const fields = [...step.fields]
          fields.splice(action.index, 0, movedField!)
          return { ...step, fields }
        })
      }
      return { ...state, schema }
    }

    case 'ADD_STEP': {
      const schema = { ...state.schema }
      schema.steps = [...schema.steps, action.step]
      return { ...state, schema, activeStepId: action.step.id }
    }

    case 'REMOVE_STEP': {
      if (state.schema.steps.length <= 1) return state
      const schema = { ...state.schema }
      const idx = schema.steps.findIndex((s) => s.id === action.stepId)
      schema.steps = schema.steps.filter((s) => s.id !== action.stepId)
      const activeStepId =
        state.activeStepId === action.stepId
          ? schema.steps[Math.max(0, idx - 1)]?.id ?? schema.steps[0]?.id
          : state.activeStepId
      return { ...state, schema, activeStepId, selectedFieldId: null }
    }

    case 'UPDATE_STEP': {
      const schema = { ...state.schema }
      schema.steps = schema.steps.map((step) =>
        step.id === action.stepId ? { ...step, ...action.updates } : step
      )
      return { ...state, schema }
    }

    case 'REORDER_STEPS': {
      const schema = { ...state.schema }
      const steps = [...schema.steps]
      const activeIndex = steps.findIndex((s) => s.id === action.activeId)
      const overIndex = steps.findIndex((s) => s.id === action.overId)
      if (activeIndex === -1 || overIndex === -1) return state
      const [moved] = steps.splice(activeIndex, 1)
      steps.splice(overIndex, 0, moved)
      schema.steps = steps
      return { ...state, schema }
    }

    case 'SELECT_FIELD': {
      return { ...state, selectedFieldId: action.fieldId }
    }

    case 'SET_ACTIVE_STEP': {
      return { ...state, activeStepId: action.stepId, selectedFieldId: null }
    }

    default:
      return state
  }
}

export function useBuilderState(initialSchema: FormSchema) {
  const [state, dispatch] = useReducer(builderReducer, {
    schema: initialSchema,
    selectedFieldId: null,
    activeStepId: initialSchema.steps[0]?.id ?? '',
  })

  const activeStep = state.schema.steps.find((s) => s.id === state.activeStepId) ?? null
  const selectedField = activeStep?.fields.find((f) => f.id === state.selectedFieldId) ?? null

  // Auto-save tracking
  const lastSavedRef = useRef<string>(JSON.stringify(initialSchema))
  const hasUnsavedChanges = JSON.stringify(state.schema) !== lastSavedRef.current

  const markSaved = useCallback(() => {
    lastSavedRef.current = JSON.stringify(state.schema)
  }, [state.schema])

  return {
    state,
    dispatch,
    activeStep,
    selectedField,
    hasUnsavedChanges,
    markSaved,
  }
}
