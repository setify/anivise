'use client'

import { useState, useEffect, useCallback } from 'react'

export interface SavedFilter {
  id: string
  name: string
  status?: string
  departmentId?: string
  locationId?: string
  managerId?: string
}

export function useSavedFilters(key: string) {
  const storageKey = `anivise:${key}:filters`
  const [filters, setFilters] = useState<SavedFilter[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setFilters(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [storageKey])

  const saveFilter = useCallback(
    (filter: Omit<SavedFilter, 'id'>) => {
      const newFilter: SavedFilter = {
        ...filter,
        id: crypto.randomUUID(),
      }
      const updated = [...filters, newFilter]
      setFilters(updated)
      localStorage.setItem(storageKey, JSON.stringify(updated))
    },
    [filters, storageKey]
  )

  const deleteFilter = useCallback(
    (id: string) => {
      const updated = filters.filter((f) => f.id !== id)
      setFilters(updated)
      localStorage.setItem(storageKey, JSON.stringify(updated))
    },
    [filters, storageKey]
  )

  return { filters, saveFilter, deleteFilter }
}
