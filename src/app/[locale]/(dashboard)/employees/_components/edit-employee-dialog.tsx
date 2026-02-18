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
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { AvatarUpload } from './avatar-upload'
import { updateEmployee } from '../actions'
import type { EmployeeItem, ManagerOption } from '../actions'
import type { OrgDepartment, OrgLocation } from '../../users/actions'

interface EditEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeItem
  departments: OrgDepartment[]
  locations: OrgLocation[]
  managers: ManagerOption[]
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
  departments,
  locations,
  managers,
}: EditEmployeeDialogProps) {
  const t = useTranslations('org.employees.editDialog')
  const ta = useTranslations('org.employees.addDialog')
  const [loading, setLoading] = useState(false)
  const [departmentId, setDepartmentId] = useState(employee.department?.id ?? '')
  const [locationId, setLocationId] = useState(employee.location?.id ?? '')
  const [managerId, setManagerId] = useState(employee.manager?.memberId ?? '')

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  const [firstName, setFirstName] = useState(employee.firstName)
  const [lastName, setLastName] = useState(employee.lastName)

  const deptOptions = [
    { label: t('noDepartment'), value: '' },
    ...departments.map((d) => ({ label: d.name, value: d.id })),
  ]
  const locOptions = [
    { label: t('noLocation'), value: '' },
    ...locations.map((l) => ({ label: l.name, value: l.id })),
  ]
  const managerOptions = [
    { label: t('noManager'), value: '' },
    ...managers.map((m) => ({ label: m.fullName, value: m.memberId })),
  ]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    form.set('id', employee.id)
    form.set('departmentId', departmentId)
    form.set('locationId', locationId)
    form.set('managerId', managerId)

    if (avatarFile) {
      form.set('avatarFile', avatarFile)
    } else if (avatarUrl) {
      form.set('avatarUrl', avatarUrl)
    } else if (removeAvatar) {
      form.set('removeAvatar', 'true')
    }

    const result = await updateEmployee(form)
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{ta('firstName')}</Label>
              <Input
                name="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{ta('lastName')}</Label>
              <Input
                name="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{ta('email')}</Label>
              <Input name="email" type="email" defaultValue={employee.email ?? ''} />
            </div>
            <div className="space-y-2">
              <Label>{ta('phone')}</Label>
              <Input name="phone" defaultValue={employee.phone ?? ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{ta('position')}</Label>
            <Input name="position" defaultValue={employee.position ?? ''} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{ta('department')}</Label>
              <Combobox
                value={departmentId}
                onValueChange={setDepartmentId}
                options={deptOptions}
                placeholder={ta('selectDepartment')}
              />
            </div>
            <div className="space-y-2">
              <Label>{ta('location')}</Label>
              <Combobox
                value={locationId}
                onValueChange={setLocationId}
                options={locOptions}
                placeholder={ta('selectLocation')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{ta('manager')}</Label>
            <Combobox
              value={managerId}
              onValueChange={setManagerId}
              options={managerOptions}
              placeholder={ta('selectManager')}
            />
          </div>

          <AvatarUpload
            currentUrl={employee.avatarUrl}
            name={`${firstName} ${lastName}`.trim()}
            onFileSelect={(f) => { setAvatarFile(f); setAvatarUrl(null); setRemoveAvatar(false) }}
            onUrlSelect={(url) => { setAvatarUrl(url); setAvatarFile(null); setRemoveAvatar(false) }}
            onRemove={() => { setAvatarFile(null); setAvatarUrl(null); setRemoveAvatar(true) }}
            removed={removeAvatar}
            fileSelected={avatarFile}
            selectedUrl={avatarUrl}
          />

          <div className="space-y-2">
            <Label>{ta('notes')}</Label>
            <Textarea name="notes" defaultValue={employee.notes ?? ''} rows={3} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('saving') : t('saveButton')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
