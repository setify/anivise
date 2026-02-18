'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  employees,
  organizationMembers,
  orgDepartments,
  orgLocations,
  users,
} from '@/lib/db/schema'
import { eq, and, count, desc, sql } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { logAudit } from '@/lib/audit/log'
import { canAddEmployee } from '@/lib/products/limits'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackUpload } from '@/lib/media/track-upload'

// ─── Query Helpers ───────────────────────────────────────────────────

export async function getEmployees() {
  const ctx = await getCurrentOrgContext('manager')
  if (!ctx) return []

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
      manager: {
        memberId: organizationMembers.id,
        userId: users.id,
        fullName: users.fullName,
      },
    })
    .from(employees)
    .leftJoin(orgDepartments, eq(employees.departmentId, orgDepartments.id))
    .leftJoin(orgLocations, eq(employees.locationId, orgLocations.id))
    .leftJoin(organizationMembers, eq(employees.managerId, organizationMembers.id))
    .leftJoin(users, eq(organizationMembers.userId, users.id))
    .where(eq(employees.organizationId, ctx.organizationId))
    .orderBy(desc(employees.createdAt))

  return rows.map((r) => ({
    id: r.employee.id,
    firstName: r.employee.firstName,
    lastName: r.employee.lastName,
    fullName: `${r.employee.firstName} ${r.employee.lastName}`.trim(),
    email: r.employee.email,
    phone: r.employee.phone,
    position: r.employee.position,
    avatarUrl: r.employee.avatarUrl,
    avatarStoragePath: r.employee.avatarStoragePath,
    status: r.employee.status,
    notes: r.employee.notes,
    createdAt: r.employee.createdAt,
    department: r.department?.id ? { id: r.department.id, name: r.department.name } : null,
    location: r.location?.id ? { id: r.location.id, name: r.location.name } : null,
    manager: r.manager?.memberId
      ? { memberId: r.manager.memberId, userId: r.manager.userId, fullName: r.manager.fullName }
      : null,
  }))
}

export type EmployeeItem = Awaited<ReturnType<typeof getEmployees>>[number]

export async function getEmployeeById(id: string) {
  const ctx = await getCurrentOrgContext('manager')
  if (!ctx) return null

  const [row] = await db
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
      manager: {
        memberId: organizationMembers.id,
        userId: users.id,
        fullName: users.fullName,
      },
    })
    .from(employees)
    .leftJoin(orgDepartments, eq(employees.departmentId, orgDepartments.id))
    .leftJoin(orgLocations, eq(employees.locationId, orgLocations.id))
    .leftJoin(organizationMembers, eq(employees.managerId, organizationMembers.id))
    .leftJoin(users, eq(organizationMembers.userId, users.id))
    .where(
      and(
        eq(employees.id, id),
        eq(employees.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!row) return null

  return {
    id: row.employee.id,
    firstName: row.employee.firstName,
    lastName: row.employee.lastName,
    fullName: `${row.employee.firstName} ${row.employee.lastName}`.trim(),
    email: row.employee.email,
    phone: row.employee.phone,
    position: row.employee.position,
    avatarUrl: row.employee.avatarUrl,
    avatarStoragePath: row.employee.avatarStoragePath,
    status: row.employee.status,
    notes: row.employee.notes,
    createdAt: row.employee.createdAt,
    department: row.department?.id ? { id: row.department.id, name: row.department.name } : null,
    location: row.location?.id ? { id: row.location.id, name: row.location.name } : null,
    manager: row.manager?.memberId
      ? { memberId: row.manager.memberId, userId: row.manager.userId, fullName: row.manager.fullName }
      : null,
  }
}

export type EmployeeDetail = NonNullable<Awaited<ReturnType<typeof getEmployeeById>>>

export async function getEmployeeStats() {
  const ctx = await getCurrentOrgContext('manager')
  if (!ctx) return { total: 0, active: 0, inactive: 0, archived: 0 }

  const statusCounts = await db
    .select({
      status: employees.status,
      value: count(),
    })
    .from(employees)
    .where(eq(employees.organizationId, ctx.organizationId))
    .groupBy(employees.status)

  const countByStatus = new Map(statusCounts.map((r) => [r.status, r.value]))

  const active = countByStatus.get('active') ?? 0
  const inactive = countByStatus.get('inactive') ?? 0
  const archived = countByStatus.get('archived') ?? 0

  return {
    total: active + inactive + archived,
    active,
    inactive,
    archived,
  }
}

export async function getManagerOptions() {
  const ctx = await getCurrentOrgContext('manager')
  if (!ctx) return []

  const rows = await db
    .select({
      memberId: organizationMembers.id,
      userId: users.id,
      fullName: users.fullName,
      firstName: users.firstName,
      lastName: users.lastName,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(
      and(
        eq(organizationMembers.organizationId, ctx.organizationId),
        eq(organizationMembers.status, 'active'),
        sql`${organizationMembers.role} IN ('org_admin', 'manager')`
      )
    )
    .orderBy(users.fullName)

  return rows.map((r) => ({
    memberId: r.memberId,
    userId: r.userId,
    fullName: r.fullName || `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
    role: r.role,
  }))
}

export type ManagerOption = Awaited<ReturnType<typeof getManagerOptions>>[number]

// ─── Mutations ───────────────────────────────────────────────────────

async function handleAvatarUpload(
  formData: FormData,
  organizationId: string,
  employeeId: string,
  userId: string
): Promise<{ avatarUrl: string | null | undefined; avatarStoragePath: string | null | undefined }> {
  const avatarFile = formData.get('avatarFile') as File | null
  const avatarUrlFromMedia = formData.get('avatarUrl') as string | null
  const removeAvatar = formData.get('removeAvatar') === 'true'

  if (removeAvatar) {
    return { avatarUrl: null, avatarStoragePath: null }
  }

  if (avatarUrlFromMedia) {
    return { avatarUrl: avatarUrlFromMedia, avatarStoragePath: null }
  }

  if (avatarFile && avatarFile.size > 0) {
    const adminSupabase = createAdminClient()
    const ext = avatarFile.name.split('.').pop() ?? 'png'
    const path = `${organizationId}/employees/${employeeId}/${Date.now()}.${ext}`
    const bytes = await avatarFile.arrayBuffer()
    const { error: uploadError } = await adminSupabase.storage
      .from('org-assets')
      .upload(path, bytes, { contentType: avatarFile.type, upsert: true })

    if (!uploadError) {
      await trackUpload({
        bucket: 'org-assets',
        path,
        filename: avatarFile.name,
        mimeType: avatarFile.type,
        size: avatarFile.size,
        context: 'employee_avatar',
        contextEntityId: employeeId,
        uploadedBy: userId,
      })

      const { data } = adminSupabase.storage
        .from('org-assets')
        .getPublicUrl(path)

      return { avatarUrl: data.publicUrl, avatarStoragePath: path }
    }
  }

  return { avatarUrl: undefined, avatarStoragePath: undefined }
}

export async function createEmployee(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  // Check employee seat limit
  const allowed = await canAddEmployee(ctx.organizationId)
  if (!allowed) return { success: false, error: 'employee_limit_reached' }

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = (formData.get('email') as string) || null
  const phone = (formData.get('phone') as string) || null
  const position = (formData.get('position') as string) || null
  const departmentId = (formData.get('departmentId') as string) || null
  const locationId = (formData.get('locationId') as string) || null
  const managerId = (formData.get('managerId') as string) || null
  const notes = (formData.get('notes') as string) || null

  // Insert employee first to get ID
  const [emp] = await db
    .insert(employees)
    .values({
      organizationId: ctx.organizationId,
      firstName,
      lastName,
      email,
      phone,
      position,
      departmentId,
      locationId,
      managerId,
      notes,
      createdBy: ctx.userId,
    })
    .returning()

  // Handle avatar upload
  const { avatarUrl, avatarStoragePath } = await handleAvatarUpload(
    formData,
    ctx.organizationId,
    emp.id,
    ctx.userId
  )

  if (avatarUrl !== undefined) {
    await db
      .update(employees)
      .set({
        avatarUrl: avatarUrl,
        avatarStoragePath: avatarStoragePath ?? null,
      })
      .where(eq(employees.id, emp.id))
  }

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'employee.created',
    entityType: 'employee',
    entityId: emp.id,
    organizationId: ctx.organizationId,
    metadata: { firstName, lastName },
  })

  revalidatePath('/employees')
  return { success: true }
}

export async function updateEmployee(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const id = formData.get('id') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = (formData.get('email') as string) || null
  const phone = (formData.get('phone') as string) || null
  const position = (formData.get('position') as string) || null
  const departmentId = (formData.get('departmentId') as string) || null
  const locationId = (formData.get('locationId') as string) || null
  const managerId = (formData.get('managerId') as string) || null
  const notes = (formData.get('notes') as string) || null

  // Verify employee belongs to this org
  const [existing] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(
      and(
        eq(employees.id, id),
        eq(employees.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!existing) return { success: false, error: 'not_found' }

  // Handle avatar
  const { avatarUrl, avatarStoragePath } = await handleAvatarUpload(
    formData,
    ctx.organizationId,
    id,
    ctx.userId
  )

  await db
    .update(employees)
    .set({
      firstName,
      lastName,
      email,
      phone,
      position,
      departmentId,
      locationId,
      managerId,
      notes,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(avatarStoragePath !== undefined ? { avatarStoragePath } : {}),
      updatedAt: new Date(),
    })
    .where(eq(employees.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'employee.updated',
    entityType: 'employee',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/employees')
  revalidatePath(`/employees/${id}`)
  return { success: true }
}

export async function deleteEmployee(id: string) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [existing] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(
      and(
        eq(employees.id, id),
        eq(employees.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!existing) return { success: false, error: 'not_found' }

  await db.delete(employees).where(eq(employees.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'employee.deleted',
    entityType: 'employee',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/employees')
  return { success: true }
}

export async function changeEmployeeStatus(id: string, newStatus: 'active' | 'inactive' | 'archived') {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [existing] = await db
    .select({ id: employees.id, status: employees.status })
    .from(employees)
    .where(
      and(
        eq(employees.id, id),
        eq(employees.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!existing) return { success: false, error: 'not_found' }

  await db
    .update(employees)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(employees.id, id))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'employee.status_changed',
    entityType: 'employee',
    entityId: id,
    organizationId: ctx.organizationId,
    metadata: { oldStatus: existing.status, newStatus },
  })

  revalidatePath('/employees')
  revalidatePath(`/employees/${id}`)
  return { success: true }
}
