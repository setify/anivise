'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { changeUserRole } from '../actions'
import type { OrgUser } from '../actions'
import type { OrganizationLimits, OrganizationUsage } from '@/lib/products/limits'

interface ChangeRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: OrgUser
  seats: { limits: OrganizationLimits; usage: OrganizationUsage } | null
}

const ROLES = ['org_admin', 'manager', 'member'] as const

export function ChangeRoleDialog({
  open,
  onOpenChange,
  user,
  seats,
}: ChangeRoleDialogProps) {
  const t = useTranslations('org.users.changeRoleDialog')
  const tr = useTranslations('org.users.roles')
  const [loading, setLoading] = useState(false)
  const [newRole, setNewRole] = useState(user.role)

  const displayName = user.fullName || user.email

  function getAvailableSeats(role: string): number | null {
    if (!seats) return null
    // member role has no seat limit (employees are tracked separately)
    if (role === 'member') return null
    const limitMap: Record<string, number | null> = {
      org_admin: seats.limits.maxOrgAdmins,
      manager: seats.limits.maxManagers,
    }
    const usageMap: Record<string, number> = {
      org_admin: seats.usage.orgAdmins,
      manager: seats.usage.managers,
    }
    const limit = limitMap[role]
    if (limit === null) return null // unlimited
    const current = usageMap[role] ?? 0
    // If switching from this role, it frees a seat
    const adjustment = role !== user.role ? 0 : -1
    return limit - current + adjustment
  }

  async function handleSubmit() {
    if (newRole === user.role) return
    setLoading(true)
    const form = new FormData()
    form.set('memberId', user.id)
    form.set('newRole', newRole)

    const result = await changeUserRole(form)
    setLoading(false)

    if (result.success) {
      toast.success(t('changed'))
      onOpenChange(false)
    } else if (result.error === 'last_admin') {
      toast.error(t('lastAdminWarning'))
    } else if (result.error === 'seat_limit_reached') {
      toast.error(t('noSeatAvailable', { role: tr(newRole) }))
    } else {
      toast.error(t('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { name: displayName })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={newRole} onValueChange={(v) => setNewRole(v as 'org_admin' | 'manager' | 'member')}>
            {ROLES.map((role) => {
              const available = getAvailableSeats(role)
              const isDisabled = available !== null && available <= 0 && role !== user.role
              return (
                <div key={role} className="flex items-center space-x-2">
                  <RadioGroupItem value={role} id={role} disabled={isDisabled} />
                  <Label htmlFor={role} className="flex-1 cursor-pointer">
                    <span>{tr(role)}</span>
                    {role === user.role && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({t('currentRole')})
                      </span>
                    )}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={loading || newRole === user.role}
          >
            {loading ? t('changing') : t('changeButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
