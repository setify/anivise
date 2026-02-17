'use client'

import { useDroppable } from '@dnd-kit/core'
import { useTranslations } from 'next-intl'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CanvasEmptyStateProps {
  stepId: string
}

export function CanvasEmptyState({ stepId }: CanvasEmptyStateProps) {
  const t = useTranslations('admin.forms.builder')
  const { setNodeRef, isOver } = useDroppable({
    id: `empty-${stepId}`,
    data: { type: 'canvas', stepId },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
        isOver
          ? 'border-primary/50 bg-primary/5'
          : 'border-muted-foreground/20'
      )}
    >
      <GripVertical className="text-muted-foreground/40 mb-3 size-10" />
      <p className="text-muted-foreground text-sm">{t('emptyCanvas')}</p>
    </div>
  )
}
