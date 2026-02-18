'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { updateMember } from '../actions'
import type { OrgUser, OrgDepartment, OrgLocation } from '../actions'

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: OrgUser
  departments: OrgDepartment[]
  locations: OrgLocation[]
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  departments,
  locations,
}: EditUserDialogProps) {
  const t = useTranslations('org.users.editDialog')
  const [loading, setLoading] = useState(false)
  const [departmentId, setDepartmentId] = useState(user.department?.id ?? '')
  const [locationId, setLocationId] = useState(user.location?.id ?? '')

  const deptOptions = [
    { label: t('noDepartment'), value: '' },
    ...departments.map((d) => ({ label: d.name, value: d.id })),
  ]
  const locOptions = [
    { label: t('noLocation'), value: '' },
    ...locations.map((l) => ({ label: l.name, value: l.id })),
  ]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    form.set('memberId', user.id)
    form.set('departmentId', departmentId)
    form.set('locationId', locationId)

    const result = await updateMember(form)
    setLoading(false)

    if (result.success) {
      toast.success(t('saved'))
      onOpenChange(false)
    } else {
      toast.error(t('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('email')}</Label>
            <Input value={user.email} disabled className="bg-muted" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('firstName')}</Label>
              <Input
                name="firstName"
                defaultValue={user.firstName ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('lastName')}</Label>
              <Input
                name="lastName"
                defaultValue={user.lastName ?? ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('position')}</Label>
            <Input
              name="position"
              defaultValue={user.position ?? ''}
              placeholder={t('positionPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('department')}</Label>
            <Combobox
              value={departmentId}
              onValueChange={setDepartmentId}
              options={deptOptions}
              placeholder={t('selectDepartment')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('location')}</Label>
            <Combobox
              value={locationId}
              onValueChange={setLocationId}
              options={locOptions}
              placeholder={t('selectLocation')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('phone')}</Label>
            <Input
              name="phone"
              defaultValue={user.phone ?? ''}
              placeholder={t('phonePlaceholder')}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('saving') : t('saveButton')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
