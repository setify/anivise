// ============================================
// FIELD TYPES
// ============================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'radio'
  | 'checkbox'
  | 'csat'
  | 'rating'
  | 'hidden'

// ============================================
// DISPLAY VARIANTS
// ============================================

export type SelectDisplayVariant = 'default' | 'buttons'

// ============================================
// FIELD OPTIONS (for Radio/Checkbox)
// ============================================

export interface FieldOption {
  id: string
  label: string
  value: string
}

// ============================================
// CONDITIONAL LOGIC
// ============================================

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'

export interface FieldCondition {
  fieldId: string
  operator: ConditionOperator
  value: string | number | boolean
}

export interface ConditionalLogic {
  action: 'show' | 'hide'
  logicType: 'all' | 'any'
  conditions: FieldCondition[]
}

// ============================================
// FIELD VALIDATION
// ============================================

export interface FieldValidation {
  pattern?: string
  patternMessage?: string
  customMessage?: string
}

// ============================================
// TYPE-SPECIFIC CONFIG
// ============================================

export interface TextFieldConfig {
  type: 'text'
  minLength?: number
  maxLength?: number
}

export interface TextareaFieldConfig {
  type: 'textarea'
  minLength?: number
  maxLength?: number
  rows?: number
}

export interface NumberFieldConfig {
  type: 'number'
  min?: number
  max?: number
  step?: number
  unit?: string
}

export interface EmailFieldConfig {
  type: 'email'
}

export interface PhoneFieldConfig {
  type: 'phone'
  defaultCountryCode?: string
}

export interface DateFieldConfig {
  type: 'date'
  minDate?: string
  maxDate?: string
  includeTime?: boolean
}

export interface RadioFieldConfig {
  type: 'radio'
  options: FieldOption[]
  allowOther?: boolean
}

export interface CheckboxFieldConfig {
  type: 'checkbox'
  options: FieldOption[]
  minSelections?: number
  maxSelections?: number
  allowOther?: boolean
}

export interface CsatFieldConfig {
  type: 'csat'
  minLabel?: string
  maxLabel?: string
  scale: 10
}

export interface RatingFieldConfig {
  type: 'rating'
  maxStars: 5
  icon?: 'star' | 'heart' | 'thumb'
}

export interface HiddenFieldConfig {
  type: 'hidden'
  fixedValue?: string
  sourceType?: 'fixed' | 'url_param' | 'user_field'
  sourceKey?: string
}

export type FieldConfig =
  | TextFieldConfig
  | TextareaFieldConfig
  | NumberFieldConfig
  | EmailFieldConfig
  | PhoneFieldConfig
  | DateFieldConfig
  | RadioFieldConfig
  | CheckboxFieldConfig
  | CsatFieldConfig
  | RatingFieldConfig
  | HiddenFieldConfig

// ============================================
// FIELD DEFINITION
// ============================================

export interface FormField {
  id: string
  type: FieldType
  label: string
  description?: string
  placeholder?: string
  required: boolean
  defaultValue?: string | number | boolean | string[]
  config: FieldConfig
  displayVariant?: SelectDisplayVariant
  conditionalLogic?: ConditionalLogic
  validation?: FieldValidation
}

// ============================================
// FORM STEP
// ============================================

export interface FormStep {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

// ============================================
// COMPLETE FORM SCHEMA
// ============================================

export interface FormSchema {
  version: string
  steps: FormStep[]
}
