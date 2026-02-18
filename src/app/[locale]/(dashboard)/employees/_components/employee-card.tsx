'use client'

import { useTranslations } from 'next-intl'
import { MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { EmployeeItem } from '../actions'

interface EmployeeCardProps {
  employee: EmployeeItem
  onEdit: () => void
  onChangeStatus: () => void
  onDelete: () => void
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  archived: 'outline',
}

export function EmployeeCard({
  employee,
  onEdit,
  onChangeStatus,
  onDelete,
}: EmployeeCardProps) {
  const t = useTranslations('org.employees')
  const router = useRouter()

  return (
    <div
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50',
        employee.status !== 'active' && 'opacity-60'
      )}
      onClick={() => router.push(`/employees/${employee.id}`)}
    >
      <AvatarDisplay
        name={employee.fullName}
        email={employee.email}
        avatarUrl={employee.avatarUrl}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{employee.fullName}</p>
          <Badge variant={statusBadgeVariant[employee.status] || 'outline'} className="shrink-0">
            {t(`status.${employee.status}`)}
          </Badge>
        </div>
        {employee.position && (
          <p className="text-muted-foreground truncate text-sm">{employee.position}</p>
        )}
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
          {employee.department && <span>{employee.department.name}</span>}
          {employee.location && <span>{employee.location.name}</span>}
          {employee.manager && <span>{employee.manager.fullName}</span>}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/employees/${employee.id}`) }}>
            {t('actions.view')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit() }}>
            {t('actions.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onChangeStatus() }}>
            {t('actions.changeStatus')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-destructive focus:text-destructive"
          >
            {t('actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
