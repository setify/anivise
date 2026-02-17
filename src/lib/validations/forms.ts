import { z } from 'zod/v4'

// ============================================
// FIELD OPTION
// ============================================

const fieldOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
})

// ============================================
// CONDITIONAL LOGIC
// ============================================

const conditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
])

const fieldConditionSchema = z.object({
  fieldId: z.string().min(1),
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
})

const conditionalLogicSchema = z.object({
  action: z.enum(['show', 'hide']),
  logicType: z.enum(['all', 'any']),
  conditions: z.array(fieldConditionSchema).min(1),
})

// ============================================
// FIELD VALIDATION
// ============================================

const fieldValidationSchema = z.object({
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
  customMessage: z.string().optional(),
})

// ============================================
// TYPE-SPECIFIC CONFIGS
// ============================================

const textFieldConfigSchema = z.object({
  type: z.literal('text'),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
})

const textareaFieldConfigSchema = z.object({
  type: z.literal('textarea'),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  rows: z.number().int().min(1).max(50).optional(),
})

const numberFieldConfigSchema = z.object({
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  unit: z.string().optional(),
})

const emailFieldConfigSchema = z.object({
  type: z.literal('email'),
})

const phoneFieldConfigSchema = z.object({
  type: z.literal('phone'),
  defaultCountryCode: z.string().optional(),
})

const dateFieldConfigSchema = z.object({
  type: z.literal('date'),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  includeTime: z.boolean().optional(),
})

const radioFieldConfigSchema = z.object({
  type: z.literal('radio'),
  options: z.array(fieldOptionSchema).min(1),
  allowOther: z.boolean().optional(),
})

const checkboxFieldConfigSchema = z.object({
  type: z.literal('checkbox'),
  options: z.array(fieldOptionSchema).min(1),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
  allowOther: z.boolean().optional(),
})

const csatFieldConfigSchema = z.object({
  type: z.literal('csat'),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  scale: z.literal(10),
})

const ratingFieldConfigSchema = z.object({
  type: z.literal('rating'),
  maxStars: z.literal(5),
  icon: z.enum(['star', 'heart', 'thumb']).optional(),
})

const hiddenFieldConfigSchema = z.object({
  type: z.literal('hidden'),
  fixedValue: z.string().optional(),
  sourceType: z.enum(['fixed', 'url_param', 'user_field']).optional(),
  sourceKey: z.string().optional(),
})

const fieldConfigSchema = z.discriminatedUnion('type', [
  textFieldConfigSchema,
  textareaFieldConfigSchema,
  numberFieldConfigSchema,
  emailFieldConfigSchema,
  phoneFieldConfigSchema,
  dateFieldConfigSchema,
  radioFieldConfigSchema,
  checkboxFieldConfigSchema,
  csatFieldConfigSchema,
  ratingFieldConfigSchema,
  hiddenFieldConfigSchema,
])

// ============================================
// FIELD DEFINITION
// ============================================

export const formFieldValidator = z.object({
  id: z.string().min(1),
  type: z.enum([
    'text',
    'textarea',
    'number',
    'email',
    'phone',
    'date',
    'radio',
    'checkbox',
    'csat',
    'rating',
    'hidden',
  ]),
  label: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  defaultValue: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .optional(),
  config: fieldConfigSchema,
  displayVariant: z.enum(['default', 'buttons']).optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
  validation: fieldValidationSchema.optional(),
})

// ============================================
// FORM STEP
// ============================================

const formStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(formFieldValidator).min(1),
})

// ============================================
// COMPLETE FORM SCHEMA VALIDATOR
// ============================================

export const formSchemaValidator = z.object({
  version: z.string().min(1),
  steps: z.array(formStepSchema).min(1),
})

// ============================================
// FORM METADATA VALIDATOR
// ============================================

export const formMetaValidator = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
      message: 'Slug must be lowercase alphanumeric with hyphens only',
    }),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  visibility: z.enum(['all_organizations', 'assigned']).optional(),
  stepDisplayMode: z.enum(['progress_bar', 'tabs']).optional(),
  completionType: z.enum(['thank_you', 'redirect']).optional(),
  completionTitle: z.string().max(255).optional(),
  completionMessage: z.string().max(5000).optional(),
  completionRedirectUrl: z.url().optional(),
  sendConfirmationEmail: z.boolean().optional(),
  confirmationEmailTemplateId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
})

export type FormMetaInput = z.infer<typeof formMetaValidator>

// ============================================
// DYNAMIC SUBMISSION VALIDATOR
// ============================================

import type { FormSchema, FormField } from '@/types/form-schema'

/**
 * Creates a Zod validator dynamically from a FormSchema definition.
 * Each field ID becomes a key in the resulting object schema.
 * Validation rules are derived from the field type, required flag, and config.
 */
export function createSubmissionValidator(schema: FormSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const step of schema.steps) {
    for (const field of step.fields) {
      shape[field.id] = buildFieldValidator(field)
    }
  }

  return z.object(shape)
}

function buildFieldValidator(field: FormField): z.ZodTypeAny {
  let validator: z.ZodTypeAny

  switch (field.type) {
    case 'text':
    case 'textarea': {
      let v = z.string()
      if (field.config.type === 'text' || field.config.type === 'textarea') {
        if (field.config.minLength !== undefined) v = v.min(field.config.minLength)
        if (field.config.maxLength !== undefined) v = v.max(field.config.maxLength)
      }
      validator = v
      break
    }

    case 'email': {
      validator = z.email()
      break
    }

    case 'phone': {
      validator = z.string().min(1)
      break
    }

    case 'number': {
      let v = z.number()
      if (field.config.type === 'number') {
        if (field.config.min !== undefined) v = v.min(field.config.min)
        if (field.config.max !== undefined) v = v.max(field.config.max)
      }
      validator = v
      break
    }

    case 'date': {
      validator = z.string().min(1)
      break
    }

    case 'radio': {
      if (field.config.type === 'radio' && field.config.options.length > 0) {
        const values = field.config.options.map((o) => o.value)
        if (field.config.allowOther) {
          validator = z.string().min(1)
        } else {
          validator = z.enum(values as [string, ...string[]])
        }
      } else {
        validator = z.string()
      }
      break
    }

    case 'checkbox': {
      if (field.config.type === 'checkbox' && field.config.options.length > 0) {
        let v = z.array(z.string())
        if (field.config.minSelections !== undefined) v = v.min(field.config.minSelections)
        if (field.config.maxSelections !== undefined) v = v.max(field.config.maxSelections)
        validator = v
      } else {
        validator = z.array(z.string())
      }
      break
    }

    case 'csat': {
      validator = z.number().int().min(1).max(10)
      break
    }

    case 'rating': {
      validator = z.number().int().min(1).max(5)
      break
    }

    case 'hidden': {
      validator = z.string().optional()
      break
    }

    default: {
      validator = z.unknown()
    }
  }

  // Hidden fields are always optional
  if (field.type === 'hidden') {
    return validator
  }

  // Make non-required fields optional
  if (!field.required) {
    validator = validator.optional()
  }

  return validator
}
