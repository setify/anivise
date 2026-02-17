'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations } from 'next-intl'
import { GripVertical, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FormField } from '@/types/form-schema'
import { FIELD_TYPE_DEFINITIONS } from './builder-types'

interface CanvasFieldProps {
  field: FormField
  stepId: string
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}

export function CanvasField({
  field,
  stepId,
  isSelected,
  onSelect,
  onRemove,
}: CanvasFieldProps) {
  const t = useTranslations('admin.forms.builder')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: { type: 'canvas-field', stepId, fieldId: field.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
  }

  const def = FIELD_TYPE_DEFINITIONS.find((d) => d.type === field.type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card transition-all',
        isSelected
          ? 'border-primary/50 bg-primary/5 ring-primary/20 ring-1'
          : 'hover:border-muted-foreground/30',
        isDragging && 'z-50 shadow-lg opacity-90'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <button
          className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="text-sm">{def?.icon}</span>
        <span className="text-muted-foreground truncate text-xs">
          {t(`fieldNames.${def?.labelKey ?? field.type}`)}
        </span>
        {field.required && (
          <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
            {t('required')}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Body preview */}
      <div className="px-3 py-3">
        <p className="text-sm font-medium">
          {field.label || (
            <span className="text-muted-foreground italic">{t('noLabel')}</span>
          )}
        </p>
        {field.description && (
          <p className="text-muted-foreground mt-0.5 text-xs">{field.description}</p>
        )}
        <div className="bg-muted mt-2 h-8 rounded border" />
      </div>
    </div>
  )
}
