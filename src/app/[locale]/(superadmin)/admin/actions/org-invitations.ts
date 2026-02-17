'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { teamInvitations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'
import { getSetting } from '@/lib/settings/platform'
import crypto from 'crypto'

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
  const expiryDays = await getSetting('invitation.expiry_days')
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

  const [newInvitation] = await db
    .insert(teamInvitations)
    .values({
      email: oldInvitation.email,
      invitationType: oldInvitation.invitationType,
      organizationId: oldInvitation.organizationId,
      targetOrgRole: oldInvitation.targetOrgRole,
      role: oldInvitation.role,
      invitedBy: currentUser.id,
      token,
      expiresAt,
    })
    .returning()

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'invitation.resent',
    entityType: 'invitation',
    entityId: newInvitation.id,
    organizationId: oldInvitation.organizationId ?? undefined,
    metadata: { email: oldInvitation.email, oldInvitationId: invitationId },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const inviteLink = `${appUrl}/de/invite/${token}`

  revalidatePath('/admin/organizations')
  return { success: true, inviteLink }
}

export async function cancelOrgInvitation(invitationId: string) {
  const currentUser = await requirePlatformRole('superadmin')

  await db
    .update(teamInvitations)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(teamInvitations.id, invitationId))

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'invitation.cancelled',
    entityType: 'invitation',
    entityId: invitationId,
  })

  revalidatePath('/admin/organizations')
  return { success: true }
}
