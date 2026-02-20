'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Building2, Users, FlaskConical, Search } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { globalSearch } from '@/app/[locale]/(superadmin)/admin/actions'
import type { SearchResult } from '@/app/[locale]/(superadmin)/admin/actions/search'

const typeIcons = {
  organization: Building2,
  user: Users,
  job: FlaskConical,
}

export function AdminSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin.search')

  // Cmd+K keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    const timeout = setTimeout(async () => {
      try {
        const data = await globalSearch(query)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      setResults([])
      router.push(`/${locale}${href}`)
    },
    [router, locale]
  )

  const orgResults = results.filter((r) => r.type === 'organization')
  const userResults = results.filter((r) => r.type === 'user')
  const jobResults = results.filter((r) => r.type === 'job')

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground relative hidden h-8 w-56 justify-start text-sm md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 size-3.5" />
        {t('placeholder')}
        <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t('title')}
        description={t('description')}
      >
        <CommandInput
          placeholder={t('inputPlaceholder')}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length >= 2 && !isSearching && results.length === 0 && (
            <CommandEmpty>{t('noResults')}</CommandEmpty>
          )}
          {isSearching && (
            <div className="text-muted-foreground py-6 text-center text-sm">
              {t('searching')}
            </div>
          )}

          {orgResults.length > 0 && (
            <CommandGroup heading={t('organizations')}>
              {orgResults.map((result) => {
                const Icon = typeIcons[result.type]
                return (
                  <CommandItem
                    key={result.id}
                    value={`${result.title} ${result.subtitle}`}
                    onSelect={() => handleSelect(result.href)}
                  >
                    <Icon className="mr-2 size-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {result.subtitle}
                      </span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {userResults.length > 0 && (
            <CommandGroup heading={t('users')}>
              {userResults.map((result) => {
                const Icon = typeIcons[result.type]
                return (
                  <CommandItem
                    key={result.id}
                    value={`${result.title} ${result.subtitle}`}
                    onSelect={() => handleSelect(result.href)}
                  >
                    <Icon className="mr-2 size-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {result.subtitle}
                      </span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {jobResults.length > 0 && (
            <CommandGroup heading={t('jobs')}>
              {jobResults.map((result) => {
                const Icon = typeIcons[result.type]
                return (
                  <CommandItem
                    key={result.id}
                    value={`${result.title} ${result.subtitle}`}
                    onSelect={() => handleSelect(result.href)}
                  >
                    <Icon className="mr-2 size-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {result.subtitle}
                      </span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
