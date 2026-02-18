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
import { createEmployee } from '../actions'
import type { ManagerOption } from '../actions'
import type { OrgDepartment, OrgLocation } from '../../users/actions'

interface AddEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: OrgDepartment[]
  locations: OrgLocation[]
  managers: ManagerOption[]
}

export function AddEmployeeDialog({
  open,
  onOpenChange,
  departments,
  locations,
  managers,
}: AddEmployeeDialogProps) {
  const t = useTranslations('org.employees.addDialog')
  const [loading, setLoading] = useState(false)
  const [departmentId, setDepartmentId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [managerId, setManagerId] = useState('')

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const deptOptions = departments.map((d) => ({ label: d.name, value: d.id }))
  const locOptions = locations.map((l) => ({ label: l.name, value: l.id }))
  const managerOptions = managers.map((m) => ({ label: m.fullName, value: m.memberId }))

  function resetForm() {
    setDepartmentId('')
    setLocationId('')
    setManagerId('')
    setAvatarFile(null)
    setAvatarUrl(null)
    setRemoveAvatar(false)
    setFirstName('')
    setLastName('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    if (departmentId) form.set('departmentId', departmentId)
    if (locationId) form.set('locationId', locationId)
    if (managerId) form.set('managerId', managerId)

    if (avatarFile) {
      form.set('avatarFile', avatarFile)
    } else if (avatarUrl) {
      form.set('avatarUrl', avatarUrl)
    } else if (removeAvatar) {
      form.set('removeAvatar', 'true')
    }

    const result = await createEmployee(form)
    setLoading(false)

    if (result.success) {
      toast.success(t('created'))
      resetForm()
      onOpenChange(false)
    } else {
      toast.error(t('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('firstName')}</Label>
              <Input
                name="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('firstNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('lastName')}</Label>
              <Input
                name="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('lastNamePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input name="email" type="email" placeholder={t('emailPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('phone')}</Label>
              <Input name="phone" placeholder={t('phonePlaceholder')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('position')}</Label>
            <Input name="position" placeholder={t('positionPlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label>{t('manager')}</Label>
            <Combobox
              value={managerId}
              onValueChange={setManagerId}
              options={managerOptions}
              placeholder={t('selectManager')}
            />
          </div>

          <AvatarUpload
            currentUrl={null}
            name={`${firstName} ${lastName}`.trim() || '?'}
            onFileSelect={(f) => { setAvatarFile(f); setAvatarUrl(null); setRemoveAvatar(false) }}
            onUrlSelect={(url) => { setAvatarUrl(url); setAvatarFile(null); setRemoveAvatar(false) }}
            onRemove={() => { setAvatarFile(null); setAvatarUrl(null); setRemoveAvatar(true) }}
            removed={removeAvatar}
            fileSelected={avatarFile}
            selectedUrl={avatarUrl}
          />

          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea name="notes" placeholder={t('notesPlaceholder')} rows={3} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('creating') : t('createButton')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
