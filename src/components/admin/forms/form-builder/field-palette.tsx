'use client'

import { useTranslations } from 'next-intl'
import { TooltipProvider } from '@/components/ui/tooltip'
import { FIELD_TYPE_DEFINITIONS } from './builder-types'
import { FieldPaletteItem } from './field-palette-item'

const CATEGORIES = ['text', 'selection', 'rating', 'other'] as const

export function FieldPalette() {
  const t = useTranslations('admin.forms.builder')

  const categoryLabels: Record<string, string> = {
    text: t('categories.text'),
    selection: t('categories.selection'),
    rating: t('categories.rating'),
    other: t('categories.other'),
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full w-60 flex-col border-r">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{t('fieldTypes')}</h3>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {CATEGORIES.map((category) => {
            const defs = FIELD_TYPE_DEFINITIONS.filter((d) => d.category === category)
            if (defs.length === 0) return null
            return (
              <div key={category}>
                <p className="text-muted-foreground mb-2 px-1 text-xs font-medium uppercase tracking-wider">
                  {categoryLabels[category]}
                </p>
                <div className="space-y-1.5">
                  {defs.map((def) => (
                    <FieldPaletteItem
                      key={def.type}
                      definition={def}
                      label={t(`fieldNames.${def.labelKey}`)}
                      description={t(`fieldDescriptions.${def.labelKey}`)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
