import type { FormSchema, FormStep, FormField, FieldType, FieldConfig } from '@/types/form-schema'

export type BuilderAction =
  | { type: 'ADD_FIELD'; stepId: string; field: FormField; index: number }
  | { type: 'REMOVE_FIELD'; stepId: string; fieldId: string }
  | { type: 'UPDATE_FIELD'; stepId: string; fieldId: string; updates: Partial<FormField> }
  | { type: 'REORDER_FIELDS'; stepId: string; activeId: string; overId: string }
  | { type: 'MOVE_FIELD_TO_STEP'; fieldId: string; fromStepId: string; toStepId: string; index: number }
  | { type: 'ADD_STEP'; step: FormStep }
  | { type: 'REMOVE_STEP'; stepId: string }
  | { type: 'UPDATE_STEP'; stepId: string; updates: Partial<FormStep> }
  | { type: 'REORDER_STEPS'; activeId: string; overId: string }
  | { type: 'SELECT_FIELD'; fieldId: string | null }
  | { type: 'SET_ACTIVE_STEP'; stepId: string }
  | { type: 'SET_SCHEMA'; schema: FormSchema }

export interface BuilderState {
  schema: FormSchema
  selectedFieldId: string | null
  activeStepId: string
}

export interface FieldTypeDefinition {
  type: FieldType
  labelKey: string
  icon: string
  category: 'text' | 'selection' | 'rating' | 'other'
  defaultConfig: FieldConfig
}

export const FIELD_TYPE_DEFINITIONS: FieldTypeDefinition[] = [
  // Text fields
  { type: 'text', labelKey: 'text', icon: '📝', category: 'text', defaultConfig: { type: 'text' } },
  { type: 'textarea', labelKey: 'textarea', icon: '📄', category: 'text', defaultConfig: { type: 'textarea', rows: 4 } },
  { type: 'email', labelKey: 'email', icon: '📧', category: 'text', defaultConfig: { type: 'email' } },
  { type: 'phone', labelKey: 'phone', icon: '📱', category: 'text', defaultConfig: { type: 'phone' } },
  // Selection fields
  { type: 'radio', labelKey: 'radio', icon: '🔘', category: 'selection', defaultConfig: { type: 'radio', options: [{ id: '1', label: 'Option 1', value: 'option_1' }, { id: '2', label: 'Option 2', value: 'option_2' }] } },
  { type: 'checkbox', labelKey: 'checkbox', icon: '☑️', category: 'selection', defaultConfig: { type: 'checkbox', options: [{ id: '1', label: 'Option 1', value: 'option_1' }, { id: '2', label: 'Option 2', value: 'option_2' }] } },
  // Rating fields
  { type: 'csat', labelKey: 'csat', icon: '📊', category: 'rating', defaultConfig: { type: 'csat', scale: 10 } },
  { type: 'rating', labelKey: 'rating', icon: '⭐', category: 'rating', defaultConfig: { type: 'rating', maxStars: 5 } },
  // Other fields
  { type: 'number', labelKey: 'number', icon: '🔢', category: 'other', defaultConfig: { type: 'number' } },
  { type: 'date', labelKey: 'date', icon: '📅', category: 'other', defaultConfig: { type: 'date' } },
  { type: 'hidden', labelKey: 'hidden', icon: '👁️', category: 'other', defaultConfig: { type: 'hidden' } },
]

export function createDefaultField(type: FieldType): FormField {
  const def = FIELD_TYPE_DEFINITIONS.find((d) => d.type === type)!
  return {
    id: crypto.randomUUID(),
    type,
    label: '',
    required: false,
    config: { ...def.defaultConfig } as FieldConfig,
  }
}
