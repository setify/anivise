'use client'

import { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import { cn } from '@/lib/utils'
import type { EmployeeItem } from '../actions'

interface EmployeeTableProps {
  employees: EmployeeItem[]
  onEdit: (emp: EmployeeItem) => void
  onChangeStatus: (emp: EmployeeItem) => void
  onDelete: (emp: EmployeeItem) => void
}

type SortKey = 'name' | 'position' | 'department' | 'location' | 'manager' | 'analyses' | 'status'
type SortDir = 'asc' | 'desc'

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  archived: 'bg-red-400',
}

export function EmployeeTable({
  employees,
  onEdit,
  onChangeStatus,
  onDelete,
}: EmployeeTableProps) {
  const t = useTranslations('org.employees')
  const locale = useLocale()
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const list = [...employees]
    const dir = sortDir === 'asc' ? 1 : -1

    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.fullName.localeCompare(b.fullName)
          break
        case 'position':
          cmp = (a.position ?? '').localeCompare(b.position ?? '')
          break
        case 'department':
          cmp = (a.department?.name ?? '').localeCompare(b.department?.name ?? '')
          break
        case 'location':
          cmp = (a.location?.name ?? '').localeCompare(b.location?.name ?? '')
          break
        case 'manager':
          cmp = (a.manager?.fullName ?? '').localeCompare(b.manager?.fullName ?? '')
          break
        case 'analyses':
          cmp = a.analysisCount - b.analysisCount
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
      }
      return cmp * dir
    })

    return list
  }, [employees, sortKey, sortDir])

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 inline size-3" />
      : <ArrowDown className="ml-1 inline size-3" />
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px] cursor-pointer select-none" onClick={() => toggleSort('name')}>
                {t('table.name')}<SortIcon column="name" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('position')}>
                {t('table.position')}<SortIcon column="position" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('department')}>
                {t('table.department')}<SortIcon column="department" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('location')}>
                {t('table.location')}<SortIcon column="location" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('manager')}>
                {t('table.manager')}<SortIcon column="manager" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('analyses')}>
                {t('table.analyses')}<SortIcon column="analyses" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
                {t('table.status')}<SortIcon column="status" />
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((emp) => (
              <TableRow
                key={emp.id}
                className={cn(
                  'cursor-pointer',
                  emp.status !== 'active' && 'opacity-60'
                )}
                onClick={() => router.push(`/${locale}/employees/${emp.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <AvatarDisplay
                      name={emp.fullName}
                      email={emp.email}
                      avatarUrl={emp.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{emp.fullName}</p>
                      {emp.email && (
                        <p className="text-muted-foreground truncate text-xs">{emp.email}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{emp.position ?? '–'}</TableCell>
                <TableCell className="text-sm">{emp.department?.name ?? '–'}</TableCell>
                <TableCell className="text-sm">{emp.location?.name ?? '–'}</TableCell>
                <TableCell className="text-sm">{emp.manager?.fullName ?? '–'}</TableCell>
                <TableCell>
                  {emp.analysisCount > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {emp.analysisCount}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">–</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', STATUS_DOT[emp.status] ?? 'bg-gray-400')} />
                    <span className="text-sm">{t(`status.${emp.status}`)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/employees/${emp.id}`) }}>
                        {t('actions.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(emp) }}>
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onChangeStatus(emp) }}>
                        {t('actions.changeStatus')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete(emp) }}
                        className="text-destructive focus:text-destructive"
                      >
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
