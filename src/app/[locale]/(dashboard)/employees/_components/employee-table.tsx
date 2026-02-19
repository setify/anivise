'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
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

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  archived: 'outline',
}

export function EmployeeTable({
  employees,
  onEdit,
  onChangeStatus,
  onDelete,
}: EmployeeTableProps) {
  const t = useTranslations('org.employees')
  const router = useRouter()

  return (
    <Card>
      <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">{t('table.name')}</TableHead>
            <TableHead>{t('table.position')}</TableHead>
            <TableHead>{t('table.department')}</TableHead>
            <TableHead>{t('table.location')}</TableHead>
            <TableHead>{t('table.manager')}</TableHead>
            <TableHead>{t('table.status')}</TableHead>
            <TableHead className="w-[60px]">{t('table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => (
            <TableRow
              key={emp.id}
              className={cn(
                'cursor-pointer',
                emp.status !== 'active' && 'opacity-60'
              )}
              onClick={() => router.push(`/employees/${emp.id}`)}
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
                    <p className="truncate font-medium text-sm">{emp.fullName}</p>
                    {emp.email && (
                      <p className="text-muted-foreground truncate text-xs">{emp.email}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">{emp.position ?? '-'}</TableCell>
              <TableCell className="text-sm">{emp.department?.name ?? '-'}</TableCell>
              <TableCell className="text-sm">{emp.location?.name ?? '-'}</TableCell>
              <TableCell className="text-sm">{emp.manager?.fullName ?? '-'}</TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant[emp.status] || 'outline'}>
                  {t(`status.${emp.status}`)}
                </Badge>
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
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/employees/${emp.id}`) }}>
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
