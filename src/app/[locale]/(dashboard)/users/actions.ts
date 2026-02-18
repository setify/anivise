'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  organizationMembers,
  orgDepartments,
  orgLocations,
  users,
  teamInvitations,
} from '@/lib/db/schema'
import { eq, and, count, desc, or, ne } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { logAudit } from '@/lib/audit/log'
import { getSetting } from '@/lib/settings/platform'
import { canAddMember, getOrganizationLimits, getOrganizationUsage } from '@/lib/products/limits'
import { sendTemplatedEmail } from '@/lib/email/send'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// ─── Query Helpers ───────────────────────────────────────────────────

export async function getOrgUsers() {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return []

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
    .where(eq(organizationMembers.organizationId, ctx.organizationId))
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
    phone: r.member.phone,
    status: r.member.status,
    joinedAt: r.member.joinedAt,
    deactivatedAt: r.member.deactivatedAt,
    department: r.department?.id ? { id: r.department.id, name: r.department.name } : null,
    location: r.location?.id ? { id: r.location.id, name: r.location.name } : null,
    isCurrentUser: r.user.id === ctx.userId,
  }))
}

export type OrgUser = Awaited<ReturnType<typeof getOrgUsers>>[number]

export async function getOrgUserStats() {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { total: 0, active: 0, deactivated: 0, pendingInvitations: 0 }

  const memberCounts = await db
    .select({
      status: organizationMembers.status,
      value: count(),
    })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, ctx.organizationId))
    .groupBy(organizationMembers.status)

  const countByStatus = new Map(memberCounts.map((r) => [r.status, r.value]))

  const [invResult] = await db
    .select({ value: count() })
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.organizationId, ctx.organizationId),
        eq(teamInvitations.invitationType, 'organization'),
        eq(teamInvitations.status, 'pending')
      )
    )

  const active = countByStatus.get('active') ?? 0
  const deactivated = countByStatus.get('deactivated') ?? 0

  return {
    total: active + deactivated,
    active,
    deactivated,
    pendingInvitations: invResult?.value ?? 0,
  }
}

export async function getOrgInvitations() {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return []

  const rows = await db
    .select({
      invitation: teamInvitations,
      inviter: {
        fullName: users.fullName,
        email: users.email,
      },
    })
    .from(teamInvitations)
    .innerJoin(users, eq(teamInvitations.invitedBy, users.id))
    .where(
      and(
        eq(teamInvitations.organizationId, ctx.organizationId),
        eq(teamInvitations.invitationType, 'organization'),
        or(
          eq(teamInvitations.status, 'pending'),
          eq(teamInvitations.status, 'expired')
        )
      )
    )
    .orderBy(desc(teamInvitations.createdAt))

  return rows.map((r) => ({
    id: r.invitation.id,
    email: r.invitation.email,
    targetOrgRole: r.invitation.targetOrgRole,
    status: r.invitation.status,
    invitedFirstName: r.invitation.invitedFirstName,
    invitedLastName: r.invitation.invitedLastName,
    inviterName: r.inviter.fullName,
    inviterEmail: r.inviter.email,
    expiresAt: r.invitation.expiresAt,
    createdAt: r.invitation.createdAt,
  }))
}

export type OrgInvitation = Awaited<ReturnType<typeof getOrgInvitations>>[number]

export async function getOrgDepartments() {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      department: orgDepartments,
      usageCount: count(organizationMembers.id),
    })
    .from(orgDepartments)
    .leftJoin(organizationMembers, eq(orgDepartments.id, organizationMembers.departmentId))
    .where(eq(orgDepartments.organizationId, ctx.organizationId))
    .groupBy(orgDepartments.id)
    .orderBy(orgDepartments.sortOrder, orgDepartments.name)

  return rows.map((r) => ({
    id: r.department.id,
    name: r.department.name,
    description: r.department.description,
    sortOrder: r.department.sortOrder,
    usageCount: r.usageCount,
  }))
}

export type OrgDepartment = Awaited<ReturnType<typeof getOrgDepartments>>[number]

export async function getOrgLocations() {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return []

  const rows = await db
    .select({
      location: orgLocations,
      usageCount: count(organizationMembers.id),
    })
    .from(orgLocations)
    .leftJoin(organizationMembers, eq(orgLocations.id, organizationMembers.locationId))
    .where(eq(orgLocations.organizationId, ctx.organizationId))
    .groupBy(orgLocations.id)
    .orderBy(orgLocations.sortOrder, orgLocations.name)

  return rows.map((r) => ({
    id: r.location.id,
    name: r.location.name,
    address: r.location.address,
    city: r.location.city,
    country: r.location.country,
    sortOrder: r.location.sortOrder,
    usageCount: r.usageCount,
  }))
}

export type OrgLocation = Awaited<ReturnType<typeof getOrgLocations>>[number]

export async function getOrgSeats() {
  const ctx = await getCurrentOrgContext()
  if (!ctx) return null

  const [limits, usage] = await Promise.all([
    getOrganizationLimits(ctx.organizationId),
    getOrganizationUsage(ctx.organizationId),
  ])

  return { limits, usage }
}

// ─── User CRUD ───────────────────────────────────────────────────────

export async function inviteUser(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const email = formData.get('email') as string
  const targetOrgRole = formData.get('targetOrgRole') as 'org_admin' | 'manager'
  const firstName = (formData.get('firstName') as string) || undefined
  const lastName = (formData.get('lastName') as string) || undefined
  const position = (formData.get('position') as string) || undefined
  const departmentId = (formData.get('departmentId') as string) || undefined
  const locationId = (formData.get('locationId') as string) || undefined

  // Check seat limit
  const allowed = await canAddMember(ctx.organizationId, targetOrgRole)
  if (!allowed) return { success: false, error: 'seat_limit_reached' }

  // Check if already a member
  const [existing] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(
      and(
        eq(organizationMembers.organizationId, ctx.organizationId),
        eq(users.email, email)
      )
    )
    .limit(1)

  if (existing) return { success: false, error: 'already_member' }

  const token = crypto.randomBytes(32).toString('hex')
  const expiryDays = await getSetting('invitation.expiry_days')
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

  const [invitation] = await db
    .insert(teamInvitations)
    .values({
      email,
      invitationType: 'organization',
      organizationId: ctx.organizationId,
      targetOrgRole,
      invitedBy: ctx.userId,
      token,
      expiresAt,
      invitedFirstName: firstName ?? null,
      invitedLastName: lastName ?? null,
      invitedPosition: position ?? null,
      invitedDepartmentId: departmentId ?? null,
      invitedLocationId: locationId ?? null,
    })
    .returning()

  // Send invitation email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const inviteLink = `${appUrl}/de/invite/${token}`

  await sendTemplatedEmail({
    to: email,
    templateSlug: 'org-invitation',
    locale: 'de',
    variables: {
      inviteLink,
      role: targetOrgRole,
      expiryDays: String(expiryDays),
      inviterName: ctx.email,
    },
  })

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'org_member.invited',
    entityType: 'invitation',
    entityId: invitation.id,
    organizationId: ctx.organizationId,
    metadata: { email, role: targetOrgRole },
  })

  revalidatePath('/users')
  return { success: true }
}

export async function createUserDirect(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const email = formData.get('email') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const targetOrgRole = formData.get('targetOrgRole') as 'org_admin' | 'manager'
  const password = formData.get('password') as string
  const position = (formData.get('position') as string) || undefined
  const departmentId = (formData.get('departmentId') as string) || undefined
  const locationId = (formData.get('locationId') as string) || undefined
  const phone = (formData.get('phone') as string) || undefined

  // Check seat limit
  const allowed = await canAddMember(ctx.organizationId, targetOrgRole)
  if (!allowed) return { success: false, error: 'seat_limit_reached' }

  // Create user in Supabase Auth
  const supabaseAdmin = createAdminClient()
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `${firstName} ${lastName}`.trim(),
      force_password_change: true,
    },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already been registered')) {
      return { success: false, error: 'email_exists' }
    }
    return { success: false, error: authError?.message ?? 'Failed to create user' }
  }

  // Insert user record
  await db.insert(users).values({
    id: authData.user.id,
    email,
    fullName: `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    preferredLocale: 'de',
  })

  // Create membership
  await db.insert(organizationMembers).values({
    organizationId: ctx.organizationId,
    userId: authData.user.id,
    role: targetOrgRole,
    invitedBy: ctx.userId,
    joinedAt: new Date(),
    position: position ?? null,
    departmentId: departmentId ?? null,
    locationId: locationId ?? null,
    phone: phone ?? null,
  })

  // Send welcome email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  await sendTemplatedEmail({
    to: email,
    templateSlug: 'direct-create-welcome',
    locale: 'de',
    variables: {
      firstName,
      loginUrl: `${appUrl}/de/login`,
      email,
    },
  })

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'org_member.created_direct',
    entityType: 'organization_member',
    entityId: authData.user.id,
    organizationId: ctx.organizationId,
    metadata: { email, role: targetOrgRole },
  })

  revalidatePath('/users')
  return { success: true }
}

export async function updateMember(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const memberId = formData.get('memberId') as string
  const position = formData.get('position') as string | null
  const departmentId = formData.get('departmentId') as string | null
  const locationId = formData.get('locationId') as string | null
  const phone = formData.get('phone') as string | null
  const firstName = formData.get('firstName') as string | null
  const lastName = formData.get('lastName') as string | null

  // Verify membership belongs to this org
  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!member) return { success: false, error: 'not_found' }

  // Update member fields
  await db
    .update(organizationMembers)
    .set({
      position: position ?? null,
      departmentId: departmentId || null,
      locationId: locationId || null,
      phone: phone ?? null,
      updatedAt: new Date(),
    })
    .where(eq(organizationMembers.id, memberId))

  // Update user name if provided
  if (firstName !== null || lastName !== null) {
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (firstName !== null) updates.firstName = firstName
    if (lastName !== null) updates.lastName = lastName
    if (firstName !== null && lastName !== null) {
      updates.fullName = `${firstName} ${lastName}`.trim()
    }
    await db.update(users).set(updates).where(eq(users.id, member.userId))
  }

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'org_member.updated',
    entityType: 'organization_member',
    entityId: memberId,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/users')
  return { success: true }
}

export async function changeUserRole(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const memberId = formData.get('memberId') as string
  const newRole = formData.get('newRole') as 'org_admin' | 'manager' | 'member'

  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!member) return { success: false, error: 'not_found' }

  // Last admin protection
  if (member.role === 'org_admin' && newRole !== 'org_admin') {
    const [adminCount] = await db
      .select({ value: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, ctx.organizationId),
          eq(organizationMembers.role, 'org_admin'),
          eq(organizationMembers.status, 'active')
        )
      )
    if ((adminCount?.value ?? 0) <= 1) {
      return { success: false, error: 'last_admin' }
    }
  }

  // Check seat limit for the new role
  if (newRole !== member.role) {
    const allowed = await canAddMember(ctx.organizationId, newRole)
    if (!allowed) return { success: false, error: 'seat_limit_reached' }
  }

  await db
    .update(organizationMembers)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(organizationMembers.id, memberId))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'org_member.role_changed',
    entityType: 'organization_member',
    entityId: memberId,
    organizationId: ctx.organizationId,
    metadata: { oldRole: member.role, newRole },
  })

  revalidatePath('/users')
  return { success: true }
}

export async function deactivateUser(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const memberId = formData.get('memberId') as string

  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!member) return { success: false, error: 'not_found' }

  // Self-protection
  if (member.userId === ctx.userId) {
    return { success: false, error: 'cannot_deactivate_self' }
  }

  // Last admin protection
  if (member.role === 'org_admin') {
    const [adminCount] = await db
      .select({ value: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, ctx.organizationId),
          eq(organizationMembers.role, 'org_admin'),
          eq(organizationMembers.status, 'active')
        )
      )
    if ((adminCount?.value ?? 0) <= 1) {
      return { success: false, error: 'last_admin' }
    }
  }

  await db
    .update(organizationMembers)
    .set({
      status: 'deactivated',
      deactivatedAt: new Date(),
      deactivatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(eq(organizationMembers.id, memberId))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'org_member.deactivated',
    entityType: 'organization_member',
    entityId: memberId,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/users')
  return { success: true }
}

export async function reactivateUser(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const memberId = formData.get('memberId') as string

  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!member) return { success: false, error: 'not_found' }

  // Check seat limit
  const allowed = await canAddMember(ctx.organizationId, member.role)
  if (!allowed) return { success: false, error: 'seat_limit_reached' }

  await db
    .update(organizationMembers)
    .set({
      status: 'active',
      deactivatedAt: null,
      deactivatedBy: null,
      updatedAt: new Date(),
    })
    .where(eq(organizationMembers.id, memberId))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'org_member.reactivated',
    entityType: 'organization_member',
    entityId: memberId,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/users')
  return { success: true }
}

export async function removeUserFromOrg(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const memberId = formData.get('memberId') as string
  const confirmName = formData.get('confirmName') as string

  const [member] = await db
    .select({
      member: organizationMembers,
      user: { fullName: users.fullName, email: users.email },
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(
      and(
        eq(organizationMembers.id, memberId),
        eq(organizationMembers.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!member) return { success: false, error: 'not_found' }

  // Name confirmation
  const expectedName = member.user.fullName || member.user.email
  if (confirmName !== expectedName) {
    return { success: false, error: 'name_mismatch' }
  }

  // Self-protection
  if (member.member.userId === ctx.userId) {
    return { success: false, error: 'cannot_remove_self' }
  }

  // Last admin protection
  if (member.member.role === 'org_admin') {
    const [adminCount] = await db
      .select({ value: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, ctx.organizationId),
          eq(organizationMembers.role, 'org_admin'),
          eq(organizationMembers.status, 'active')
        )
      )
    if ((adminCount?.value ?? 0) <= 1) {
      return { success: false, error: 'last_admin' }
    }
  }

  // Hard delete membership
  await db
    .delete(organizationMembers)
    .where(eq(organizationMembers.id, memberId))

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'org_member.removed',
    entityType: 'organization_member',
    entityId: memberId,
    organizationId: ctx.organizationId,
    metadata: { email: member.user.email },
  })

  revalidatePath('/users')
  return { success: true }
}

// ─── Invitation Actions ──────────────────────────────────────────────

export async function resendInvitation(invitationId: string) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const [oldInvitation] = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.id, invitationId),
        eq(teamInvitations.organizationId, ctx.organizationId)
      )
    )
    .limit(1)

  if (!oldInvitation) return { success: false, error: 'not_found' }

  // Cancel old
  await db
    .update(teamInvitations)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(teamInvitations.id, invitationId))

  // Create new with same details
  const token = crypto.randomBytes(32).toString('hex')
  const expiryDays = await getSetting('invitation.expiry_days')
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

  const [newInvitation] = await db
    .insert(teamInvitations)
    .values({
      email: oldInvitation.email,
      invitationType: 'organization',
      organizationId: ctx.organizationId,
      targetOrgRole: oldInvitation.targetOrgRole,
      invitedBy: ctx.userId,
      token,
      expiresAt,
      invitedFirstName: oldInvitation.invitedFirstName,
      invitedLastName: oldInvitation.invitedLastName,
      invitedPosition: oldInvitation.invitedPosition,
      invitedDepartmentId: oldInvitation.invitedDepartmentId,
      invitedLocationId: oldInvitation.invitedLocationId,
    })
    .returning()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const inviteLink = `${appUrl}/de/invite/${token}`

  await sendTemplatedEmail({
    to: oldInvitation.email,
    templateSlug: 'org-invitation',
    locale: 'de',
    variables: {
      inviteLink,
      role: oldInvitation.targetOrgRole ?? 'member',
      expiryDays: String(expiryDays),
      inviterName: ctx.email,
    },
  })

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'invitation.resent',
    entityType: 'invitation',
    entityId: newInvitation.id,
    organizationId: ctx.organizationId,
    metadata: { email: oldInvitation.email },
  })

  revalidatePath('/users')
  return { success: true }
}

export async function revokeInvitation(invitationId: string) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  await db
    .update(teamInvitations)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(teamInvitations.id, invitationId),
        eq(teamInvitations.organizationId, ctx.organizationId)
      )
    )

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'invitation.cancelled',
    entityType: 'invitation',
    entityId: invitationId,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/users')
  return { success: true }
}

// ─── Department CRUD ─────────────────────────────────────────────────

export async function createDepartment(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null

  const [dept] = await db
    .insert(orgDepartments)
    .values({
      organizationId: ctx.organizationId,
      name,
      description,
    })
    .returning()

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'department.created',
    entityType: 'department',
    entityId: dept.id,
    organizationId: ctx.organizationId,
    metadata: { name },
  })

  revalidatePath('/users')
  return { success: true, department: dept }
}

export async function updateDepartment(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null

  await db
    .update(orgDepartments)
    .set({ name, description, updatedAt: new Date() })
    .where(
      and(
        eq(orgDepartments.id, id),
        eq(orgDepartments.organizationId, ctx.organizationId)
      )
    )

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'department.updated',
    entityType: 'department',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/users')
  return { success: true }
}

export async function deleteDepartment(id: string) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  // Check if in use
  const [usage] = await db
    .select({ value: count() })
    .from(organizationMembers)
    .where(eq(organizationMembers.departmentId, id))

  if ((usage?.value ?? 0) > 0) {
    return { success: false, error: 'in_use' }
  }

  await db
    .delete(orgDepartments)
    .where(
      and(
        eq(orgDepartments.id, id),
        eq(orgDepartments.organizationId, ctx.organizationId)
      )
    )

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'department.deleted',
    entityType: 'department',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/users')
  return { success: true }
}

// ─── Location CRUD ───────────────────────────────────────────────────

export async function createLocation(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const name = formData.get('name') as string
  const address = (formData.get('address') as string) || null
  const city = (formData.get('city') as string) || null
  const country = (formData.get('country') as string) || null

  const [loc] = await db
    .insert(orgLocations)
    .values({
      organizationId: ctx.organizationId,
      name,
      address,
      city,
      country,
    })
    .returning()

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'location.created',
    entityType: 'location',
    entityId: loc.id,
    organizationId: ctx.organizationId,
    metadata: { name },
  })

  revalidatePath('/users')
  return { success: true, location: loc }
}

export async function updateLocation(formData: FormData) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const address = (formData.get('address') as string) || null
  const city = (formData.get('city') as string) || null
  const country = (formData.get('country') as string) || null

  await db
    .update(orgLocations)
    .set({ name, address, city, country, updatedAt: new Date() })
    .where(
      and(
        eq(orgLocations.id, id),
        eq(orgLocations.organizationId, ctx.organizationId)
      )
    )

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'location.updated',
    entityType: 'location',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/users')
  return { success: true }
}

export async function deleteLocation(id: string) {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) return { success: false, error: 'unauthorized' }

  // Check if in use
  const [usage] = await db
    .select({ value: count() })
    .from(organizationMembers)
    .where(eq(organizationMembers.locationId, id))

  if ((usage?.value ?? 0) > 0) {
    return { success: false, error: 'in_use' }
  }

  await db
    .delete(orgLocations)
    .where(
      and(
        eq(orgLocations.id, id),
        eq(orgLocations.organizationId, ctx.organizationId)
      )
    )

  await logAudit({
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: 'location.deleted',
    entityType: 'location',
    entityId: id,
    organizationId: ctx.organizationId,
  })

  revalidatePath('/users')
  return { success: true }
}
