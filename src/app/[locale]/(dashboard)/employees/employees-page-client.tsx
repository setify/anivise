'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Users, UserCheck, UserMinus, Archive, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { EmployeeCard } from './_components/employee-card'
import { EmployeeTable } from './_components/employee-table'
import { AddEmployeeDialog } from './_components/add-employee-dialog'
import { EditEmployeeDialog } from './_components/edit-employee-dialog'
import { ChangeStatusDialog } from './_components/change-status-dialog'
import { DeleteEmployeeDialog } from './_components/delete-employee-dialog'
import { SavedFilters } from './_components/saved-filters'
import { useSavedFilters } from '@/hooks/use-saved-filters'
import type { EmployeeItem, ManagerOption } from './actions'
import type { OrgDepartment, OrgLocation } from '../users/actions'

interface EmployeesPageClientProps {
  employees: EmployeeItem[]
  stats: { total: number; active: number; inactive: number; archived: number }
  departments: OrgDepartment[]
  locations: OrgLocation[]
  managers: ManagerOption[]
}

export function EmployeesPageClient({
  employees,
  stats,
  departments,
  locations,
  managers,
}: EmployeesPageClientProps) {
  const t = useTranslations('org.employees')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [managerFilter, setManagerFilter] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<EmployeeItem | null>(null)
  const [statusEmployee, setStatusEmployee] = useState<EmployeeItem | null>(null)
  const [deleteEmp, setDeleteEmp] = useState<EmployeeItem | null>(null)

  const { filters: savedFilters, saveFilter, deleteFilter } = useSavedFilters('employees')

  const deptOptions = [
    { label: t('filters.allDepartments'), value: '' },
    ...departments.map((d) => ({ label: d.name, value: d.id })),
  ]
  const locOptions = [
    { label: t('filters.allLocations'), value: '' },
    ...locations.map((l) => ({ label: l.name, value: l.id })),
  ]
  const managerOptions = [
    { label: t('filters.allManagers'), value: '' },
    ...managers.map((m) => ({ label: m.fullName, value: m.memberId })),
  ]

  const filtered = useMemo(() => {
    let result = employees

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.position?.toLowerCase().includes(q)
      )
    }

    if (departmentFilter) {
      result = result.filter((e) => e.department?.id === departmentFilter)
    }
    if (locationFilter) {
      result = result.filter((e) => e.location?.id === locationFilter)
    }
    if (managerFilter) {
      result = result.filter((e) => e.manager?.memberId === managerFilter)
    }

    return result
  }, [employees, search, departmentFilter, locationFilter, managerFilter])

  const activeEmployees = filtered.filter((e) => e.status === 'active')
  const inactiveEmployees = filtered.filter((e) => e.status === 'inactive')
  const archivedEmployees = filtered.filter((e) => e.status === 'archived')

  const statCards = [
    { label: t('stats.total'), value: stats.total, icon: Users },
    { label: t('stats.active'), value: stats.active, icon: UserCheck },
    { label: t('stats.inactive'), value: stats.inactive, icon: UserMinus },
    { label: t('stats.archived'), value: stats.archived, icon: Archive },
  ]

  function renderEmployees(list: EmployeeItem[], emptyKey: string) {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground text-sm">{t(`empty.${emptyKey}`)}</p>
        </div>
      )
    }

    if (viewMode === 'table') {
      return (
        <EmployeeTable
          employees={list}
          onEdit={setEditEmployee}
          onChangeStatus={setStatusEmployee}
          onDelete={setDeleteEmp}
        />
      )
    }

    return (
      <Card>
        <CardContent className="divide-y p-0">
          {list.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onEdit={() => setEditEmployee(emp)}
              onChangeStatus={() => setStatusEmployee(emp)}
              onDelete={() => setDeleteEmp(emp)}
            />
          ))}
        </CardContent>
      </Card>
    )
  }

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
          {t('addEmployee')}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Combobox
          value={departmentFilter}
          onValueChange={setDepartmentFilter}
          options={deptOptions}
          placeholder={t('filters.allDepartments')}
          className="w-48"
        />
        <Combobox
          value={locationFilter}
          onValueChange={setLocationFilter}
          options={locOptions}
          placeholder={t('filters.allLocations')}
          className="w-48"
        />
        <Combobox
          value={managerFilter}
          onValueChange={setManagerFilter}
          options={managerOptions}
          placeholder={t('filters.allManagers')}
          className="w-48"
        />
        <SavedFilters
          filters={savedFilters}
          onApply={(f) => {
            setDepartmentFilter(f.departmentId ?? '')
            setLocationFilter(f.locationId ?? '')
            setManagerFilter(f.managerId ?? '')
          }}
          onSave={(name) => {
            saveFilter({
              name,
              departmentId: departmentFilter || undefined,
              locationId: locationFilter || undefined,
              managerId: managerFilter || undefined,
            })
          }}
          onDelete={deleteFilter}
        />

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="icon"
            className="size-8"
            onClick={() => setViewMode('card')}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon"
            className="size-8"
            onClick={() => setViewMode('table')}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            {t('tabs.all')} ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            {t('tabs.active')} ({activeEmployees.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            {t('tabs.inactive')} ({inactiveEmployees.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            {t('tabs.archived')} ({archivedEmployees.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderEmployees(filtered, 'noResults')}
        </TabsContent>
        <TabsContent value="active">
          {renderEmployees(activeEmployees, 'noActive')}
        </TabsContent>
        <TabsContent value="inactive">
          {renderEmployees(inactiveEmployees, 'noInactive')}
        </TabsContent>
        <TabsContent value="archived">
          {renderEmployees(archivedEmployees, 'noArchived')}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddEmployeeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        departments={departments}
        locations={locations}
        managers={managers}
      />

      {editEmployee && (
        <EditEmployeeDialog
          open={!!editEmployee}
          onOpenChange={(open) => !open && setEditEmployee(null)}
          employee={editEmployee}
          departments={departments}
          locations={locations}
          managers={managers}
        />
      )}

      {statusEmployee && (
        <ChangeStatusDialog
          open={!!statusEmployee}
          onOpenChange={(open) => !open && setStatusEmployee(null)}
          employee={statusEmployee}
        />
      )}

      {deleteEmp && (
        <DeleteEmployeeDialog
          open={!!deleteEmp}
          onOpenChange={(open) => !open && setDeleteEmp(null)}
          employee={deleteEmp}
        />
      )}
    </div>
  )
}
