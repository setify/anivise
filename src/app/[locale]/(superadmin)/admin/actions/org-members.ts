'use server'

import { db } from '@/lib/db'
import {
  organizationMembers,
  orgDepartments,
  orgLocations,
  users,
  employees,
} from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

export async function getOrgMembers(orgId: string) {
  await requirePlatformRole('staff')

  const rows = await db
    .select({
      member: organizationMembers,
      user: {
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
      },
      department: {
        id: orgDepartments.id,
        name: orgDepartments.name,
      },
      location: {
        id: orgLocations.id,
        name: orgLocations.name,
      },
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .leftJoin(orgDepartments, eq(organizationMembers.departmentId, orgDepartments.id))
    .leftJoin(orgLocations, eq(organizationMembers.locationId, orgLocations.id))
    .where(eq(organizationMembers.organizationId, orgId))
    .orderBy(desc(organizationMembers.createdAt))

  return rows.map((r) => ({
    id: r.member.id,
    userId: r.user.id,
    email: r.user.email,
    fullName: r.user.fullName,
    firstName: r.user.firstName,
    lastName: r.user.lastName,
    avatarUrl: r.user.avatarUrl,
    role: r.member.role,
    position: r.member.position,
    status: r.member.status,
    joinedAt: r.member.joinedAt,
    department: r.department?.id ? { id: r.department.id, name: r.department.name } : null,
    location: r.location?.id ? { id: r.location.id, name: r.location.name } : null,
  }))
}

export async function getOrgEmployees(orgId: string) {
  await requirePlatformRole('staff')

  const rows = await db
    .select({
      employee: employees,
      department: {
        id: orgDepartments.id,
        name: orgDepartments.name,
      },
      location: {
        id: orgLocations.id,
        name: orgLocations.name,
      },
    })
    .from(employees)
    .leftJoin(orgDepartments, eq(employees.departmentId, orgDepartments.id))
    .leftJoin(orgLocations, eq(employees.locationId, orgLocations.id))
    .where(eq(employees.organizationId, orgId))
    .orderBy(desc(employees.createdAt))

  return rows.map((r) => ({
    id: r.employee.id,
    firstName: r.employee.firstName,
    lastName: r.employee.lastName,
    fullName: `${r.employee.firstName} ${r.employee.lastName}`.trim(),
    email: r.employee.email,
    position: r.employee.position,
    status: r.employee.status,
    createdAt: r.employee.createdAt,
    department: r.department?.id ? { id: r.department.id, name: r.department.name } : null,
    location: r.location?.id ? { id: r.location.id, name: r.location.name } : null,
  }))
}
