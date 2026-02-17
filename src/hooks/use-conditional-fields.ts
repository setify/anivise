'use client'

import { useMemo } from 'react'
import type { FormSchema, FormField, FieldCondition, ConditionalLogic } from '@/types/form-schema'

function evaluateCondition(
  condition: FieldCondition,
  values: Record<string, unknown>
): boolean {
  const fieldValue = values[condition.fieldId]

  switch (condition.operator) {
    case 'equals':
      return String(fieldValue ?? '') === String(condition.value)
    case 'not_equals':
      return String(fieldValue ?? '') !== String(condition.value)
    case 'contains':
      return String(fieldValue ?? '').includes(String(condition.value))
    case 'greater_than':
      return Number(fieldValue ?? 0) > Number(condition.value)
    case 'less_than':
      return Number(fieldValue ?? 0) < Number(condition.value)
    case 'is_empty':
      return fieldValue === undefined || fieldValue === null || fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
    case 'is_not_empty':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '' &&
        !(Array.isArray(fieldValue) && fieldValue.length === 0)
    default:
      return true
  }
}

function evaluateLogic(
  logic: ConditionalLogic,
  values: Record<string, unknown>
): boolean {
  const results = logic.conditions.map((c) => evaluateCondition(c, values))

  const conditionsMet =
    logic.logicType === 'all'
      ? results.every(Boolean)
      : results.some(Boolean)

  // If action is 'show', the field is visible when conditions are met
  // If action is 'hide', the field is visible when conditions are NOT met
  return logic.action === 'show' ? conditionsMet : !conditionsMet
}

/**
 * Evaluates conditional logic for all fields in a schema.
 * Returns a Set of field IDs that should be visible.
 */
export function useConditionalFields(
  schema: FormSchema,
  values: Record<string, unknown>
): Set<string> {
  return useMemo(() => {
    const visibleFields = new Set<string>()

    for (const step of schema.steps) {
      for (const field of step.fields) {
        if (!field.conditionalLogic || field.conditionalLogic.conditions.length === 0) {
          // No conditions = always visible
          visibleFields.add(field.id)
        } else if (evaluateLogic(field.conditionalLogic, values)) {
          visibleFields.add(field.id)
        }
      }
    }

    return visibleFields
  }, [schema, values])
}
