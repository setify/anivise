'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'
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

  const Icon = definition.icon

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
            isDragging && 'opacity-40 ring-primary/30 ring-2'
          )}
        >
          <GripVertical className="text-muted-foreground/50 size-3.5 shrink-0" />
          <Icon className="text-muted-foreground size-4 shrink-0" />
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
