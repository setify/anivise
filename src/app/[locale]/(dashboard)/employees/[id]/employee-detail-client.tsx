'use client'

import { useState } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import { EditEmployeeDialog } from '../_components/edit-employee-dialog'
import { ChangeStatusDialog } from '../_components/change-status-dialog'
import type { EmployeeDetail, ManagerOption } from '../actions'
import type { OrgDepartment, OrgLocation } from '../../users/actions'

interface EmployeeDetailClientProps {
  employee: EmployeeDetail
  departments: OrgDepartment[]
  locations: OrgLocation[]
  managers: ManagerOption[]
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  archived: 'outline',
}

export function EmployeeDetailClient({
  employee,
  departments,
  locations,
  managers,
}: EmployeeDetailClientProps) {
  const t = useTranslations('org.employees.detail')
  const ts = useTranslations('org.employees.status')
  const format = useFormatter()
  const [editOpen, setEditOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/employees"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {t('backToList')}
      </Link>

      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <AvatarDisplay
            name={employee.fullName}
            email={employee.email}
            avatarUrl={employee.avatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{employee.fullName}</h1>
              <Badge variant={statusBadgeVariant[employee.status] || 'outline'}>
                {ts(employee.status)}
              </Badge>
            </div>
            {employee.position && (
              <p className="text-muted-foreground mt-1">{employee.position}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 size-4" />
              {t('editButton')}
            </Button>
            <Button variant="outline" onClick={() => setStatusOpen(true)}>
              {t('changeStatus')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('info')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label={t('email')} value={employee.email} />
            <InfoItem label={t('phone')} value={employee.phone} />
            <InfoItem label={t('department')} value={employee.department?.name} />
            <InfoItem label={t('location')} value={employee.location?.name} />
            <InfoItem label={t('manager')} value={employee.manager?.fullName} />
            <InfoItem
              label={t('createdAt')}
              value={format.dateTime(new Date(employee.createdAt), { dateStyle: 'medium' })}
            />
            {employee.notes && (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground text-xs">{t('notes')}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{employee.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analyses Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('analyses.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <p className="text-muted-foreground text-sm">{t('analyses.empty')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {editOpen && (
        <EditEmployeeDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          employee={employee}
          departments={departments}
          locations={locations}
          managers={managers}
        />
      )}

      {statusOpen && (
        <ChangeStatusDialog
          open={statusOpen}
          onOpenChange={setStatusOpen}
          employee={employee}
        />
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-sm">{value || '-'}</p>
    </div>
  )
}
