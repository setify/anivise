'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, BookOpen, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { GuideCard } from './_components/guide-card'
import { GuideTable } from './_components/guide-table'
import { GuideFormDialog } from './_components/guide-form-dialog'
import { DeleteGuideDialog } from './_components/delete-guide-dialog'
import type { GuideRow, GuideCategoryRow } from './actions'

type ViewMode = 'grid' | 'table'

interface GuidesPageClientProps {
  guides: GuideRow[]
  categories: GuideCategoryRow[]
  isAdmin: boolean
}

export function GuidesPageClient({
  guides,
  categories,
  isAdmin,
}: GuidesPageClientProps) {
  const t = useTranslations('org.guides')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [formOpen, setFormOpen] = useState(false)
  const [editGuide, setEditGuide] = useState<GuideRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GuideRow | null>(null)

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return guides
    const q = search.toLowerCase()
    return guides.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.categoryName?.toLowerCase().includes(q)
    )
  }, [guides, search])

  // Group by category (for grid view)
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; guides: GuideRow[] }>()

    for (const guide of filtered) {
      const key = guide.categoryId ?? '__uncategorized__'
      const label = guide.categoryName ?? t('uncategorized')
      if (!map.has(key)) {
        map.set(key, { label, guides: [] })
      }
      map.get(key)!.guides.push(guide)
    }

    const entries = Array.from(map.entries())
    entries.sort((a, b) => {
      if (a[0] === '__uncategorized__') return 1
      if (b[0] === '__uncategorized__') return -1
      return a[1].label.localeCompare(b[1].label)
    })

    return entries.map(([, value]) => value)
  }, [filtered, t])

  function handleEdit(guide: GuideRow) {
    setEditGuide(guide)
    setFormOpen(true)
  }

  function handleCloseForm(open: boolean) {
    setFormOpen(open)
    if (!open) setEditGuide(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditGuide(null); setFormOpen(true) }}>
            <Plus className="mr-2 size-4" />
            {t('addGuide')}
          </Button>
        )}
      </div>

      {/* Search + View Toggle */}
      {guides.length > 0 && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="border-border ml-auto flex rounded-md border">
            <Toggle
              size="sm"
              pressed={viewMode === 'grid'}
              onPressedChange={() => setViewMode('grid')}
              aria-label={t('viewGrid')}
              className="rounded-r-none"
            >
              <LayoutGrid className="size-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={viewMode === 'table'}
              onPressedChange={() => setViewMode('table')}
              aria-label={t('viewTable')}
              className="rounded-l-none"
            >
              <List className="size-4" />
            </Toggle>
          </div>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <BookOpen className="text-muted-foreground mb-3 size-10" />
          <p className="text-muted-foreground text-sm font-medium">
            {t('emptyTitle')}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t('emptyDescription')}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <GuideTable
          guides={filtered}
          isAdmin={isAdmin}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="text-muted-foreground mb-3 text-sm font-semibold uppercase tracking-wide">
                {group.label}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.guides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <GuideFormDialog
        guide={editGuide}
        categories={categories}
        open={formOpen}
        onOpenChange={handleCloseForm}
      />
      <DeleteGuideDialog
        guide={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      />
    </div>
  )
}
