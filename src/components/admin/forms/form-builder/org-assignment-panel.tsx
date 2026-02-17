'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Search, X, Building2, Globe, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  getFormAssignments,
  searchOrganizations,
  assignFormToOrganization,
  removeFormOrganizationAssignment,
  setFormVisibility,
} from '@/app/[locale]/(superadmin)/admin/forms/actions'

interface OrgAssignmentPanelProps {
  formId: string
  visibility: 'all_organizations' | 'assigned'
}

interface Assignment {
  id: string
  orgId: string
  orgName: string
  orgSlug: string
  assignedAt: Date
  assignedByName: string | null
  assignedByEmail: string | null
}

export function OrgAssignmentPanel({ formId, visibility: initialVisibility }: OrgAssignmentPanelProps) {
  const t = useTranslations('admin.forms.assignment')
  const [visibility, setVisibility] = useState(initialVisibility)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; slug: string }[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [removeOrgId, setRemoveOrgId] = useState<string | null>(null)

  const loadAssignments = useCallback(async () => {
    const data = await getFormAssignments(formId)
    setAssignments(data)
  }, [formId])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  useEffect(() => {
    if (!searchQuery || !showSearch) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      const results = await searchOrganizations(searchQuery, formId)
      setSearchResults(results)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, showSearch, formId])

  const handleVisibilityToggle = async (allOrgs: boolean) => {
    const newVisibility = allOrgs ? 'all_organizations' : 'assigned'
    const result = await setFormVisibility(formId, newVisibility)
    if (result.success) {
      setVisibility(newVisibility)
      toast.success(t('visibilityChanged'), { className: 'rounded-full' })
    }
  }

  const handleAssign = async (orgId: string) => {
    const result = await assignFormToOrganization(formId, orgId)
    if (result.success) {
      toast.success(t('assigned'), { className: 'rounded-full' })
      setSearchQuery('')
      setShowSearch(false)
      await loadAssignments()
    } else {
      toast.error(result.error ?? t('assignError'), { className: 'rounded-full' })
    }
  }

  const handleRemove = async () => {
    if (!removeOrgId) return
    const result = await removeFormOrganizationAssignment(formId, removeOrgId)
    if (result.success) {
      toast.success(t('unassigned'), { className: 'rounded-full' })
      setRemoveOrgId(null)
      await loadAssignments()
    } else {
      toast.error(result.error ?? t('unassignError'), { className: 'rounded-full' })
    }
  }

  if (visibility === 'all_organizations') {
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 flex items-start gap-3 rounded-lg p-4">
          <Globe className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{t('allOrgsHint')}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t('allOrgsDescription')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={true}
            onCheckedChange={(checked) => handleVisibilityToggle(checked)}
          />
          <Label>{t('visibleToAll')}</Label>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch
          checked={false}
          onCheckedChange={(checked) => handleVisibilityToggle(checked)}
        />
        <Label>{t('visibleToAll')}</Label>
      </div>

      {/* Add organization */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
              placeholder={t('searchOrgs')}
              className="pl-10"
            />
          </div>
        </div>

        {/* Search results dropdown */}
        {showSearch && searchResults.length > 0 && (
          <div className="rounded-lg border shadow-md">
            {searchResults.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => handleAssign(org.id)}
                className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors"
              >
                <Building2 className="text-muted-foreground size-4 shrink-0" />
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-muted-foreground text-xs">/{org.slug}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSearch && searchQuery && searchResults.length === 0 && (
          <p className="text-muted-foreground px-1 text-xs">{t('noOrgsFound')}</p>
        )}
      </div>

      {/* Assigned organizations list */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="size-4" />
          {t('assignedOrgs')} ({assignments.length})
        </Label>

        {assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noAssignments')}</p>
        ) : (
          <div className="space-y-1">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{a.orgName}</p>
                  <p className="text-muted-foreground text-xs">
                    /{a.orgSlug} · {t('assignedBy')}{' '}
                    {a.assignedByName ?? a.assignedByEmail ?? '–'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8"
                  onClick={() => setRemoveOrgId(a.orgId)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeOrgId} onOpenChange={() => setRemoveOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('removeConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancelRemove')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>{t('confirmRemove')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
