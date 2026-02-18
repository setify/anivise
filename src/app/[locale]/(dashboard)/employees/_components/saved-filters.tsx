'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bookmark, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { SavedFilter } from '@/hooks/use-saved-filters'

interface SavedFiltersProps {
  filters: SavedFilter[]
  onApply: (filter: SavedFilter) => void
  onSave: (name: string) => void
  onDelete: (id: string) => void
}

export function SavedFilters({
  filters,
  onApply,
  onSave,
  onDelete,
}: SavedFiltersProps) {
  const t = useTranslations('org.employees.filters')
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  function handleSave() {
    if (!name.trim()) return
    onSave(name.trim())
    setName('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="mr-1.5 size-3.5" />
          {t('savedFilters')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          {filters.length > 0 && (
            <div className="space-y-1">
              {filters.map((f) => (
                <div key={f.id} className="flex items-center gap-1">
                  <button
                    className="hover:bg-muted flex-1 truncate rounded px-2 py-1 text-left text-sm"
                    onClick={() => { onApply(f); setOpen(false) }}
                  >
                    {f.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={() => onDelete(f.id)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 border-t pt-2">
            <p className="text-xs font-medium">{t('saveCurrentFilters')}</p>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('filterName')}
                className="h-8 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              />
              <Button size="sm" className="h-8" onClick={handleSave} disabled={!name.trim()}>
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
