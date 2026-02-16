'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users, organizations, teamInvitations } from '@/lib/db/schema'
import { eq, and, isNull, isNotNull, count } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import {
  updateProfileSchema,
  inviteTeamMemberSchema,
  updateTeamMemberRoleSchema,
  removeTeamMemberSchema,
  createOrganizationSchema,
  deleteOrganizationSchema,
} from '@/lib/validations/admin'
import crypto from 'crypto'

// ─── Profile Actions ───

export async function updateProfile(formData: FormData) {
  const currentUser = await requirePlatformRole('staff')

  const raw = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    displayName: formData.get('displayName') as string,
    phone: formData.get('phone') as string,
    timezone: formData.get('timezone') as string,
    preferredLocale: formData.get('preferredLocale') as string,
  }

  const parsed = updateProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  const { firstName, lastName, displayName, phone, timezone, preferredLocale } =
    parsed.data

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || null

  await db
    .update(users)
    .set({
      firstName: firstName || null,
      lastName: lastName || null,
      displayName: displayName || null,
      fullName,
      phone: phone || null,
      timezone: timezone || null,
      preferredLocale,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))

  revalidatePath('/admin/profile')
  return { success: true }
}

// ─── Team Actions ───

export async function getTeamMembers() {
  await requirePlatformRole('staff')

  const members = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      platformRole: users.platformRole,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(isNull(users.deletedAt), isNotNull(users.platformRole)))

  return members
}

export async function getPendingInvitations() {
  await requirePlatformRole('staff')

  const invitations = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.status, 'pending'),
        eq(teamInvitations.invitationType, 'platform')
      )
    )

  return invitations
}

export async function inviteTeamMember(formData: FormData) {
  const currentUser = await requirePlatformRole('superadmin')

  const raw = {
    email: formData.get('email') as string,
    role: formData.get('role') as string,
  }

  const parsed = inviteTeamMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  // Check if user already has a platform role
  const [existingUser] = await db
    .select({ id: users.id, platformRole: users.platformRole })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1)

  if (existingUser?.platformRole) {
    return { success: false, error: 'User already has a platform role' }
  }

  // If user exists, just update their role
  if (existingUser) {
    await db
      .update(users)
      .set({
        platformRole: parsed.data.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id))

    revalidatePath('/admin/team')
    return { success: true }
  }

  // Otherwise create an invitation
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.insert(teamInvitations).values({
    email: parsed.data.email,
    role: parsed.data.role,
    invitationType: 'platform',
    invitedBy: currentUser.id,
    token,
    expiresAt,
  })

  revalidatePath('/admin/team')
  return { success: true }
}

export async function updateTeamMemberRole(formData: FormData) {
  await requirePlatformRole('superadmin')

  const raw = {
    userId: formData.get('userId') as string,
    role: formData.get('role') as string,
  }

  const parsed = updateTeamMemberRoleSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  await db
    .update(users)
    .set({
      platformRole: parsed.data.role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parsed.data.userId))

  revalidatePath('/admin/team')
  return { success: true }
}

export async function removeTeamMember(formData: FormData) {
  const currentUser = await requirePlatformRole('superadmin')

  const raw = {
    userId: formData.get('userId') as string,
  }

  const parsed = removeTeamMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  // Prevent removing yourself
  if (parsed.data.userId === currentUser.id) {
    return { success: false, error: 'Cannot remove yourself' }
  }

  await db
    .update(users)
    .set({
      platformRole: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parsed.data.userId))

  revalidatePath('/admin/team')
  return { success: true }
}

export async function cancelInvitation(invitationId: string) {
  await requirePlatformRole('superadmin')

  await db
    .update(teamInvitations)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(teamInvitations.id, invitationId))

  revalidatePath('/admin/team')
  return { success: true }
}

// ─── Organization Actions ───

export async function getOrganizations() {
  await requirePlatformRole('staff')

  const orgs = await db
    .select()
    .from(organizations)
    .where(isNull(organizations.deletedAt))

  return orgs
}

export async function getOrganizationById(id: string) {
  await requirePlatformRole('staff')

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1)

  return org || null
}

export async function createOrganization(formData: FormData) {
  await requirePlatformRole('superadmin')

  const raw = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    subscriptionTier: formData.get('subscriptionTier') as string,
  }

  const parsed = createOrganizationSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, parsed.data.slug))
    .limit(1)

  if (existing) {
    return { success: false, error: 'Slug already in use' }
  }

  const [newOrg] = await db
    .insert(organizations)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      subscriptionTier: parsed.data.subscriptionTier,
    })
    .returning()

  revalidatePath('/admin/organizations')
  return { success: true, data: newOrg }
}

export async function deleteOrganization(formData: FormData) {
  await requirePlatformRole('superadmin')

  const raw = {
    organizationId: formData.get('organizationId') as string,
  }

  const parsed = deleteOrganizationSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  // Soft-delete
  await db
    .update(organizations)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, parsed.data.organizationId))

  revalidatePath('/admin/organizations')
  return { success: true }
}

export async function createOrganizationWithAdmin(formData: FormData) {
  const currentUser = await requirePlatformRole('superadmin')

  const raw = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    subscriptionTier: formData.get('subscriptionTier') as string,
  }

  const parsed = createOrganizationSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  const adminEmail = (formData.get('adminEmail') as string)?.trim()
  if (!adminEmail) {
    return { success: false, error: 'Admin email is required' }
  }

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, parsed.data.slug))
    .limit(1)

  if (existing) {
    return { success: false, error: 'Slug already in use' }
  }

  // Create the organization
  const [newOrg] = await db
    .insert(organizations)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      subscriptionTier: parsed.data.subscriptionTier,
    })
    .returning()

  // Create org-admin invitation
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.insert(teamInvitations).values({
    email: adminEmail,
    invitationType: 'organization',
    organizationId: newOrg.id,
    targetOrgRole: 'org_admin',
    role: null,
    invitedBy: currentUser.id,
    token,
    expiresAt,
  })

  // Build invite link (show in dialog since Resend is not configured yet)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const inviteLink = `${appUrl}/de/invite/${token}`

  revalidatePath('/admin/organizations')
  return { success: true, inviteLink }
}

// ─── Org Invitation Management ───

export async function getOrgInvitations(organizationId: string) {
  await requirePlatformRole('staff')

  const invitations = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.organizationId, organizationId),
        eq(teamInvitations.invitationType, 'organization')
      )
    )

  return invitations
}

export async function resendOrgInvitation(invitationId: string) {
  const currentUser = await requirePlatformRole('superadmin')

  // Cancel old invitation
  const [oldInvitation] = await db
    .select()
    .from(teamInvitations)
    .where(eq(teamInvitations.id, invitationId))
    .limit(1)

  if (!oldInvitation) {
    return { success: false, error: 'Invitation not found' }
  }

  await db
    .update(teamInvitations)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(teamInvitations.id, invitationId))

  // Create new invitation with same details
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.insert(teamInvitations).values({
    email: oldInvitation.email,
    invitationType: oldInvitation.invitationType,
    organizationId: oldInvitation.organizationId,
    targetOrgRole: oldInvitation.targetOrgRole,
    role: oldInvitation.role,
    invitedBy: currentUser.id,
    token,
    expiresAt,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const inviteLink = `${appUrl}/de/invite/${token}`

  revalidatePath('/admin/organizations')
  return { success: true, inviteLink }
}

export async function cancelOrgInvitation(invitationId: string) {
  await requirePlatformRole('superadmin')

  await db
    .update(teamInvitations)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(teamInvitations.id, invitationId))

  revalidatePath('/admin/organizations')
  return { success: true }
}

// ─── Stats ───

export async function getPlatformStats() {
  await requirePlatformRole('staff')

  const [orgCount] = await db
    .select({ value: count() })
    .from(organizations)
    .where(isNull(organizations.deletedAt))

  const [userCount] = await db
    .select({ value: count() })
    .from(users)
    .where(isNull(users.deletedAt))

  return {
    totalOrganizations: orgCount?.value ?? 0,
    totalUsers: userCount?.value ?? 0,
  }
}
