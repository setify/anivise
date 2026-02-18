'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Users, UserCheck, UserX, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { PlanUsageBar } from '@/components/org/plan-usage-bar'
import { UserCard } from './_components/user-card'
import { InvitationCard } from './_components/invitation-card'
import { AddUserDialog } from './_components/add-user-dialog'
import { EditUserDialog } from './_components/edit-user-dialog'
import { ChangeRoleDialog } from './_components/change-role-dialog'
import { DeactivateDialog } from './_components/deactivate-dialog'
import { RemoveUserDialog } from './_components/remove-user-dialog'
import type { OrgUser, OrgInvitation, OrgDepartment, OrgLocation } from './actions'
import type { OrganizationLimits, OrganizationUsage } from '@/lib/products/limits'

interface UsersPageClientProps {
  members: OrgUser[]
  stats: { total: number; active: number; deactivated: number; pendingInvitations: number }
  invitations: OrgInvitation[]
  departments: OrgDepartment[]
  locations: OrgLocation[]
  seats: { limits: OrganizationLimits; usage: OrganizationUsage } | null
}

export function UsersPageClient({
  members,
  stats,
  invitations,
  departments,
  locations,
  seats,
}: UsersPageClientProps) {
  const t = useTranslations('org.users')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState<OrgUser | null>(null)
  const [changeRoleUser, setChangeRoleUser] = useState<OrgUser | null>(null)
  const [deactivateUser, setDeactivateUser] = useState<OrgUser | null>(null)
  const [removeUser, setRemoveUser] = useState<OrgUser | null>(null)
  const filtered = useMemo(() => {
    if (!search) return members
    const q = search.toLowerCase()
    return members.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        m.fullName?.toLowerCase().includes(q) ||
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.position?.toLowerCase().includes(q)
    )
  }, [members, search])

  const activeMembers = filtered.filter((m) => m.status === 'active')
  const deactivatedMembers = filtered.filter((m) => m.status === 'deactivated')

  const statCards = [
    { label: t('stats.total'), value: stats.total, icon: Users },
    { label: t('stats.active'), value: stats.active, icon: UserCheck },
    { label: t('stats.deactivated'), value: stats.deactivated, icon: UserX },
    { label: t('stats.pendingInvitations'), value: stats.pendingInvitations, icon: Mail },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t('addUser')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-muted rounded-md p-2">
                <stat.icon className="text-muted-foreground size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder={t('search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            {t('tabs.all')} ({members.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            {t('tabs.active')} ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="deactivated">
            {t('tabs.deactivated')} ({stats.deactivated})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            {t('tabs.invitations')} ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState message={t('noUsers')} description={t('noUsersDescription')} />
          ) : (
            filtered.map((m) => (
              <UserCard
                key={m.id}
                user={m}
                onEdit={() => setEditUser(m)}
                onChangeRole={() => setChangeRoleUser(m)}
                onDeactivate={() => setDeactivateUser(m)}
                onReactivate={() => setDeactivateUser(m)}
                onRemove={() => setRemoveUser(m)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-3">
          {activeMembers.length === 0 ? (
            <EmptyState message={t('noActiveUsers')} />
          ) : (
            activeMembers.map((m) => (
              <UserCard
                key={m.id}
                user={m}
                onEdit={() => setEditUser(m)}
                onChangeRole={() => setChangeRoleUser(m)}
                onDeactivate={() => setDeactivateUser(m)}
                onRemove={() => setRemoveUser(m)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="deactivated" className="space-y-3">
          {deactivatedMembers.length === 0 ? (
            <EmptyState message={t('noDeactivatedUsers')} />
          ) : (
            deactivatedMembers.map((m) => (
              <UserCard
                key={m.id}
                user={m}
                onEdit={() => setEditUser(m)}
                onChangeRole={() => setChangeRoleUser(m)}
                onReactivate={() => setDeactivateUser(m)}
                onRemove={() => setRemoveUser(m)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-3">
          {invitations.length === 0 ? (
            <EmptyState message={t('noInvitations')} />
          ) : (
            invitations.map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Seat Usage */}
      {seats && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <h3 className="text-sm font-semibold">{t('seats.title')}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlanUsageBar
                label={t('seats.orgAdmins')}
                current={seats.usage.orgAdmins}
                limit={seats.limits.maxOrgAdmins}
                unit={t('seats.seatsUsed')}
              />
              <PlanUsageBar
                label={t('seats.managers')}
                current={seats.usage.managers}
                limit={seats.limits.maxManagers}
                unit={t('seats.seatsUsed')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        departments={departments}
        locations={locations}
        seats={seats}
      />

      {editUser && (
        <EditUserDialog
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          user={editUser}
          departments={departments}
          locations={locations}
        />
      )}

      {changeRoleUser && (
        <ChangeRoleDialog
          open={!!changeRoleUser}
          onOpenChange={(open) => !open && setChangeRoleUser(null)}
          user={changeRoleUser}
          seats={seats}
        />
      )}

      {deactivateUser && (
        <DeactivateDialog
          open={!!deactivateUser}
          onOpenChange={(open) => !open && setDeactivateUser(null)}
          user={deactivateUser}
        />
      )}

      {removeUser && (
        <RemoveUserDialog
          open={!!removeUser}
          onOpenChange={(open) => !open && setRemoveUser(null)}
          user={removeUser}
        />
      )}

    </div>
  )
}

function EmptyState({ message, description }: { message: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
      <p className="text-muted-foreground text-sm">{message}</p>
      {description && (
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      )}
    </div>
  )
}
