'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import { MoreHorizontal } from 'lucide-react'
import {
  createLocation,
  updateLocation,
  deleteLocation,
  getMembersByLocation,
} from '../actions'
import type { OrgLocation, LocationMember } from '../actions'

interface LocationsClientProps {
  locations: OrgLocation[]
}

export function LocationsClient({ locations }: LocationsClientProps) {
  const t = useTranslations('org.users.locations')
  const tRoles = useTranslations('org.users.roles')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editLoc, setEditLoc] = useState<OrgLocation | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [members, setMembers] = useState<Record<string, LocationMember[]>>({})
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null)

  async function handleToggleExpand(locId: string) {
    if (expandedId === locId) {
      setExpandedId(null)
      return
    }

    setExpandedId(locId)

    if (!members[locId]) {
      setLoadingMembers(locId)
      const result = await getMembersByLocation(locId)
      setMembers((prev) => ({ ...prev, [locId]: result }))
      setLoadingMembers(null)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    if (editLoc) {
      form.set('id', editLoc.id)
      const result = await updateLocation(form)
      if (result.success) {
        toast.success(t('updated'))
        setDialogOpen(false)
        setEditLoc(null)
      } else {
        toast.error(t('error'))
      }
    } else {
      const result = await createLocation(form)
      if (result.success) {
        toast.success(t('created'))
        setDialogOpen(false)
      } else {
        toast.error(t('error'))
      }
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setLoading(true)
    const result = await deleteLocation(id)
    setLoading(false)
    if (result.success) {
      toast.success(t('deleted'))
      if (expandedId === id) setExpandedId(null)
    } else if (result.error === 'in_use') {
      toast.error(t('inUse'))
    } else {
      toast.error(t('error'))
    }
  }

  function openAdd() {
    setEditLoc(null)
    setDialogOpen(true)
  }

  function openEdit(loc: OrgLocation) {
    setEditLoc(loc)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h1>
          <p className="text-muted-foreground">{t('pageDescription')}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 size-4" />
          {t('addButton')}
        </Button>
      </div>

      {/* List */}
      {locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardContent className="p-0">
                <div
                  className="flex cursor-pointer items-center gap-4 p-4"
                  onClick={() => handleToggleExpand(loc.id)}
                >
                  <div className="text-muted-foreground shrink-0">
                    {expandedId === loc.id ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{loc.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {t('memberCount', { count: loc.usageCount })}
                      </Badge>
                    </div>
                    {(loc.address || loc.city || loc.country) && (
                      <p className="text-muted-foreground text-sm">
                        {[loc.address, loc.city, loc.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(loc)
                        }}
                      >
                        <Pencil className="mr-2 size-3.5" />
                        {tCommon('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(loc.id)
                        }}
                        disabled={loading || loc.usageCount > 0}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-3.5" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Expanded members */}
                {expandedId === loc.id && (
                  <div className="border-t px-4 py-3">
                    <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                      {t('members')}
                    </p>
                    {loadingMembers === loc.id ? (
                      <p className="text-muted-foreground py-2 text-sm">...</p>
                    ) : (members[loc.id] ?? []).length === 0 ? (
                      <p className="text-muted-foreground py-2 text-sm">{t('noMembers')}</p>
                    ) : (
                      <div className="space-y-2">
                        {(members[loc.id] ?? []).map((m) => (
                          <div
                            key={m.memberId}
                            className="flex items-center gap-3 rounded-md py-1"
                          >
                            <AvatarDisplay
                              name={m.fullName}
                              email={m.email}
                              avatarUrl={m.avatarUrl}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {m.fullName || m.email}
                              </p>
                              <p className="text-muted-foreground truncate text-xs">
                                {m.email}
                                {m.position && ` · ${m.position}`}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-xs">
                              {tRoles(m.role)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditLoc(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editLoc ? t('editTitle') : t('addTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('name')}</Label>
              <Input
                name="name"
                required
                defaultValue={editLoc?.name ?? ''}
                placeholder={t('namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('address')}</Label>
              <Input
                name="address"
                defaultValue={editLoc?.address ?? ''}
                placeholder={t('addressPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('city')}</Label>
                <Input
                  name="city"
                  defaultValue={editLoc?.city ?? ''}
                  placeholder={t('cityPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('country')}</Label>
                <Input
                  name="country"
                  defaultValue={editLoc?.country ?? ''}
                  placeholder={t('countryPlaceholder')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? (editLoc ? t('saving') : t('adding'))
                  : (editLoc ? t('save') : t('add'))}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
