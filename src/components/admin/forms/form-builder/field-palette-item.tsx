'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { FieldTypeDefinition } from './builder-types'

interface FieldPaletteItemProps {
  definition: FieldTypeDefinition
  label: string
  description?: string
}

export function FieldPaletteItem({ definition, label, description }: FieldPaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: { type: 'palette', fieldType: definition.type },
  })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={cn(
            'flex cursor-grab items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-all',
            'bg-card hover:bg-accent hover:border-accent-foreground/20 active:cursor-grabbing',
            isDragging && 'opacity-50 shadow-lg'
          )}
        >
          <span className="text-base">{definition.icon}</span>
          <span className="truncate font-medium">{label}</span>
        </div>
      </TooltipTrigger>
      {description && (
        <TooltipContent side="right">
          <p className="max-w-48">{description}</p>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
