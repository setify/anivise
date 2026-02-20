'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users, teamInvitations } from '@/lib/db/schema'
import { eq, and, isNull, isNotNull } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import {
  inviteTeamMemberSchema,
  updateTeamMemberRoleSchema,
  removeTeamMemberSchema,
} from '@/lib/validations/admin'
import { logAudit } from '@/lib/audit/log'
import { getSetting } from '@/lib/settings/platform'
import crypto from 'crypto'

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

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'team.invited',
      entityType: 'user',
      entityId: existingUser.id,
      metadata: { email: parsed.data.email, role: parsed.data.role },
    })

    revalidatePath('/admin/team')
    return { success: true }
  }

  // Otherwise create an invitation
  const token = crypto.randomBytes(32).toString('hex')
  const expiryDays = await getSetting('invitation.expiry_days')
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

  const [invitation] = await db
    .insert(teamInvitations)
    .values({
      email: parsed.data.email,
      role: parsed.data.role,
      invitationType: 'platform',
      invitedBy: currentUser.id,
      token,
      expiresAt,
    })
    .returning()

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'team.invited',
    entityType: 'invitation',
    entityId: invitation.id,
    metadata: { email: parsed.data.email, role: parsed.data.role },
  })

  // Send invitation email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const locale = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'de') as 'de' | 'en'
  const inviteLink = `${appUrl}/${locale}/invite/${token}`

  const { sendTemplatedEmail } = await import('@/lib/email/send')
  await sendTemplatedEmail({
    to: parsed.data.email,
    templateSlug: 'team-invitation',
    locale,
    variables: {
      inviteLink,
      role: parsed.data.role,
      expiryDays: String(expiryDays),
      inviterName: currentUser.displayName || currentUser.fullName || currentUser.email,
    },
  })

  revalidatePath('/admin/team')
  return { success: true }
}

export async function updateTeamMemberRole(formData: FormData) {
  const currentUser = await requirePlatformRole('superadmin')

  const raw = {
    userId: formData.get('userId') as string,
    role: formData.get('role') as string,
  }

  const parsed = updateTeamMemberRoleSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  // Get old role for audit
  const [targetUser] = await db
    .select({ platformRole: users.platformRole, email: users.email })
    .from(users)
    .where(eq(users.id, parsed.data.userId))
    .limit(1)

  await db
    .update(users)
    .set({
      platformRole: parsed.data.role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parsed.data.userId))

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'team.role_changed',
    entityType: 'user',
    entityId: parsed.data.userId,
    metadata: {
      oldRole: targetUser?.platformRole,
      newRole: parsed.data.role,
      email: targetUser?.email,
    },
  })

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

  // Get user info for audit
  const [targetUser] = await db
    .select({ email: users.email, fullName: users.fullName })
    .from(users)
    .where(eq(users.id, parsed.data.userId))
    .limit(1)

  await db
    .update(users)
    .set({
      platformRole: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parsed.data.userId))

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'team.removed',
    entityType: 'user',
    entityId: parsed.data.userId,
    metadata: { email: targetUser?.email, name: targetUser?.fullName },
  })

  revalidatePath('/admin/team')
  return { success: true }
}

export async function cancelInvitation(invitationId: string) {
  const currentUser = await requirePlatformRole('superadmin')

  await db
    .update(teamInvitations)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(teamInvitations.id, invitationId))

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'invitation.cancelled',
    entityType: 'invitation',
    entityId: invitationId,
  })

  revalidatePath('/admin/team')
  return { success: true }
}
