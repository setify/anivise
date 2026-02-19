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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import Link from 'next/link'
import { inviteUser, createUserDirect } from '../actions'
import type { OrgDepartment, OrgLocation } from '../actions'
import type { OrganizationLimits, OrganizationUsage } from '@/lib/products/limits'

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: OrgDepartment[]
  locations: OrgLocation[]
  seats: { limits: OrganizationLimits; usage: OrganizationUsage } | null
}

function generatePassword(length = 12): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

export function AddUserDialog({
  open,
  onOpenChange,
  departments,
  locations,
  seats,
}: AddUserDialogProps) {
  const t = useTranslations('org.users.addDialog')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<'org_admin' | 'manager'>('manager')
  const [departmentId, setDepartmentId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [password, setPassword] = useState('')

  const deptOptions = departments.map((d) => ({ label: d.name, value: d.id }))
  const locOptions = locations.map((l) => ({ label: l.name, value: l.id }))

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    form.set('targetOrgRole', role)
    if (departmentId) form.set('departmentId', departmentId)
    if (locationId) form.set('locationId', locationId)

    const result = await inviteUser(form)
    setLoading(false)

    if (result.success) {
      toast.success(t('invited'))
      onOpenChange(false)
    } else if (result.error === 'seat_limit_reached') {
      toast.error(t('seatLimitReached'))
    } else if (result.error === 'already_member') {
      toast.error(t('emailExists'))
    } else {
      toast.error(t('error'))
    }
  }

  async function handleDirectCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    form.set('targetOrgRole', role)
    if (departmentId) form.set('departmentId', departmentId)
    if (locationId) form.set('locationId', locationId)

    const result = await createUserDirect(form)
    setLoading(false)

    if (result.success) {
      toast.success(t('created'))
      onOpenChange(false)
    } else if (result.error === 'seat_limit_reached') {
      toast.error(t('seatLimitReached'))
    } else if (result.error === 'email_exists') {
      toast.error(t('emailExists'))
    } else {
      toast.error(t('error'))
    }
  }

  const roleField = (
    <div className="space-y-2">
      <Label>{t('role')}</Label>
      <Select value={role} onValueChange={(v) => setRole(v as 'org_admin' | 'manager')}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectRole')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="org_admin">Admin</SelectItem>
          <SelectItem value="manager">Manager</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const metadataFields = (
    <>
      <div className="space-y-2">
        <Label>{t('position')}</Label>
        <Input name="position" placeholder={t('positionPlaceholder')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('department')}</Label>
            <Link
              href="/users/departments"
              className="text-primary text-xs hover:underline"
            >
              {t('manageDepartments')}
            </Link>
          </div>
          <Combobox
            value={departmentId}
            onValueChange={setDepartmentId}
            options={deptOptions}
            placeholder={t('selectDepartment')}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('location')}</Label>
            <Link
              href="/users/locations"
              className="text-primary text-xs hover:underline"
            >
              {t('manageLocations')}
            </Link>
          </div>
          <Combobox
            value={locationId}
            onValueChange={setLocationId}
            options={locOptions}
            placeholder={t('selectLocation')}
          />
        </div>
      </div>
    </>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="invite">
          <TabsList className="w-full">
            <TabsTrigger value="invite" className="flex-1">{t('tabInvite')}</TabsTrigger>
            <TabsTrigger value="direct" className="flex-1">{t('tabDirect')}</TabsTrigger>
          </TabsList>

          <TabsContent value="invite">
            <form onSubmit={handleInvite} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('email')}</Label>
                <Input name="email" type="email" required placeholder={t('emailPlaceholder')} />
              </div>
              {roleField}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('firstName')}</Label>
                  <Input name="firstName" placeholder={t('firstNamePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('lastName')}</Label>
                  <Input name="lastName" placeholder={t('lastNamePlaceholder')} />
                </div>
              </div>
              {metadataFields}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('inviting') : t('inviteButton')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="direct">
            <form onSubmit={handleDirectCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('email')}</Label>
                <Input name="email" type="email" required placeholder={t('emailPlaceholder')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('firstName')}</Label>
                  <Input name="firstName" required placeholder={t('firstNamePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('lastName')}</Label>
                  <Input name="lastName" required placeholder={t('lastNamePlaceholder')} />
                </div>
              </div>
              {roleField}
              <div className="space-y-2">
                <Label>{t('password')}</Label>
                <div className="flex gap-2">
                  <Input
                    name="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPassword(generatePassword())}
                  >
                    {t('generatePassword')}
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">{t('passwordHint')}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('phone')}</Label>
                <Input name="phone" placeholder={t('phonePlaceholder')} />
              </div>
              {metadataFields}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('creating') : t('createButton')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
