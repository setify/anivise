'use server'

import { db } from '@/lib/db'
import {
  teamInvitations,
  users,
  organizationMembers,
  organizations,
} from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/create'
import { canAddMember } from '@/lib/products/limits'
import { sendTemplatedEmail } from '@/lib/email/send'

export type InvitationInfo = {
  id: string
  email: string
  invitationType: 'platform' | 'organization'
  role: 'superadmin' | 'staff' | null
  targetOrgRole: 'org_admin' | 'manager' | 'member' | null
  organizationName: string | null
  inviterName: string | null
  inviterEmail: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: Date
}

export type InviteValidationResult =
  | { valid: true; invitation: InvitationInfo; isLoggedIn: boolean; userEmail: string | null }
  | { valid: false; error: 'not_found' | 'expired' | 'already_used' | 'cancelled' }

export async function validateInviteToken(
  token: string
): Promise<InviteValidationResult> {
  const [invitation] = await db
    .select({
      id: teamInvitations.id,
      email: teamInvitations.email,
      invitationType: teamInvitations.invitationType,
      role: teamInvitations.role,
      targetOrgRole: teamInvitations.targetOrgRole,
      organizationId: teamInvitations.organizationId,
      invitedBy: teamInvitations.invitedBy,
      status: teamInvitations.status,
      expiresAt: teamInvitations.expiresAt,
    })
    .from(teamInvitations)
    .where(eq(teamInvitations.token, token))
    .limit(1)

  if (!invitation) {
    return { valid: false, error: 'not_found' }
  }

  if (invitation.status === 'accepted') {
    return { valid: false, error: 'already_used' }
  }

  if (invitation.status === 'cancelled') {
    return { valid: false, error: 'cancelled' }
  }

  if (invitation.expiresAt < new Date()) {
    // Mark as expired in DB
    await db
      .update(teamInvitations)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(teamInvitations.id, invitation.id))
    return { valid: false, error: 'expired' }
  }

  // Get inviter info
  const [inviter] = await db
    .select({
      fullName: users.fullName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, invitation.invitedBy))
    .limit(1)

  // Get organization name if org invitation
  let organizationName: string | null = null
  if (invitation.organizationId) {
    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, invitation.organizationId))
      .limit(1)
    organizationName = org?.name ?? null
  }

  // Check if user is logged in
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      invitationType: invitation.invitationType,
      role: invitation.role,
      targetOrgRole: invitation.targetOrgRole,
      organizationName,
      inviterName: inviter?.fullName ?? null,
      inviterEmail: inviter?.email ?? '',
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    },
    isLoggedIn: !!authUser,
    userEmail: authUser?.email ?? null,
  }
}

export async function acceptInvitation(
  token: string
): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'not_authenticated' }
  }

  // Fetch invitation
  const [invitation] = await db
    .select()
    .from(teamInvitations)
    .where(and(eq(teamInvitations.token, token), eq(teamInvitations.status, 'pending')))
    .limit(1)

  if (!invitation) {
    return { success: false, error: 'invalid_token' }
  }

  // Atomically mark invitation as accepted (prevents race conditions)
  const [accepted] = await db
    .update(teamInvitations)
    .set({
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(teamInvitations.id, invitation.id),
        eq(teamInvitations.status, 'pending'),
        gt(teamInvitations.expiresAt, new Date())
      )
    )
    .returning()

  if (!accepted) {
    return { success: false, error: 'invalid_token' }
  }

  // Get acceptor info for notification
  const [acceptor] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1)

  if (invitation.invitationType === 'platform' && invitation.role) {
    // Set platform role on the user
    await db
      .update(users)
      .set({
        platformRole: invitation.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, authUser.id))

    await createNotification({
      recipientId: invitation.invitedBy,
      type: 'invitation.accepted',
      title: `${acceptor?.fullName || acceptor?.email || invitation.email} accepted the platform invitation`,
      body: `Role: ${invitation.role}`,
      link: `/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'de'}/admin/team`,
    })

    // Send email to inviter
    const [inviter] = await db
      .select({ email: users.email, preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.id, invitation.invitedBy))
      .limit(1)

    if (inviter) {
      await sendTemplatedEmail({
        to: inviter.email,
        templateSlug: 'invitation-accepted',
        locale: (inviter.preferredLocale as 'de' | 'en') || 'de',
        variables: {
          acceptorName: acceptor?.fullName || acceptor?.email || invitation.email,
          acceptorEmail: acceptor?.email || invitation.email,
          role: invitation.role ?? '',
          orgName: '',
          orgLine: '',
        },
      })
    }

    return { success: true, redirectTo: '/admin' }
  }

  if (
    invitation.invitationType === 'organization' &&
    invitation.organizationId &&
    invitation.targetOrgRole
  ) {
    // Check plan seat limits before adding member
    const allowed = await canAddMember(
      invitation.organizationId,
      invitation.targetOrgRole
    )
    if (!allowed) {
      return { success: false, error: 'seat_limit_reached' }
    }

    // Create organization membership (copy metadata from invitation)
    await db.insert(organizationMembers).values({
      organizationId: invitation.organizationId,
      userId: authUser.id,
      role: invitation.targetOrgRole,
      invitedBy: invitation.invitedBy,
      joinedAt: new Date(),
      position: invitation.invitedPosition ?? null,
      departmentId: invitation.invitedDepartmentId ?? null,
      locationId: invitation.invitedLocationId ?? null,
    })

    // Get org name for notification
    let orgName = ''
    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, invitation.organizationId))
      .limit(1)
    orgName = org?.name ?? ''

    await createNotification({
      recipientId: invitation.invitedBy,
      type: 'invitation.accepted',
      title: `${acceptor?.fullName || acceptor?.email || invitation.email} joined ${orgName}`,
      body: `Role: ${invitation.targetOrgRole}`,
      link: `/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'de'}/admin/organizations/${invitation.organizationId}`,
    })

    // Send email to inviter
    const [orgInviter] = await db
      .select({ email: users.email, preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.id, invitation.invitedBy))
      .limit(1)

    if (orgInviter) {
      await sendTemplatedEmail({
        to: orgInviter.email,
        templateSlug: 'invitation-accepted',
        locale: (orgInviter.preferredLocale as 'de' | 'en') || 'de',
        variables: {
          acceptorName: acceptor?.fullName || acceptor?.email || invitation.email,
          acceptorEmail: acceptor?.email || invitation.email,
          role: invitation.targetOrgRole ?? '',
          orgName,
          orgLine: orgName ? `Organisation: ${orgName}` : '',
        },
        organizationId: invitation.organizationId ?? undefined,
      })
    }

    return { success: true, redirectTo: '/dashboard' }
  }

  return { success: false, error: 'invalid_invitation_type' }
}

export async function registerAndAcceptInvitation(
  token: string,
  data: { fullName: string; password: string }
): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  // Fetch invitation to get the email
  const [invitation] = await db
    .select()
    .from(teamInvitations)
    .where(and(eq(teamInvitations.token, token), eq(teamInvitations.status, 'pending')))
    .limit(1)

  if (!invitation) {
    return { success: false, error: 'invalid_token' }
  }

  // Register the user via Supabase Auth
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitation.email,
    password: data.password,
    options: {
      data: { full_name: data.fullName },
    },
  })

  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? 'Registration failed' }
  }

  // Create user record in our DB
  const nameParts = data.fullName.trim().split(/\s+/)
  const firstName = nameParts[0] || null
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null

  await db.insert(users).values({
    id: authData.user.id,
    email: invitation.email,
    fullName: data.fullName || null,
    firstName,
    lastName,
    preferredLocale: 'de',
  })

  // Atomically mark invitation as accepted (prevents race conditions)
  const [accepted] = await db
    .update(teamInvitations)
    .set({
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(teamInvitations.id, invitation.id),
        eq(teamInvitations.status, 'pending'),
        gt(teamInvitations.expiresAt, new Date())
      )
    )
    .returning()

  if (!accepted) {
    return { success: false, error: 'invalid_token' }
  }

  // Apply the invitation
  if (invitation.invitationType === 'platform' && invitation.role) {
    await db
      .update(users)
      .set({
        platformRole: invitation.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, authData.user.id))

    await createNotification({
      recipientId: invitation.invitedBy,
      type: 'invitation.accepted',
      title: `${data.fullName || invitation.email} accepted the platform invitation`,
      body: `Role: ${invitation.role}`,
      link: `/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'de'}/admin/team`,
    })

    // Send email to inviter
    const [regPlatformInviter] = await db
      .select({ email: users.email, preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.id, invitation.invitedBy))
      .limit(1)

    if (regPlatformInviter) {
      await sendTemplatedEmail({
        to: regPlatformInviter.email,
        templateSlug: 'invitation-accepted',
        locale: (regPlatformInviter.preferredLocale as 'de' | 'en') || 'de',
        variables: {
          acceptorName: data.fullName || invitation.email,
          acceptorEmail: invitation.email,
          role: invitation.role ?? '',
          orgName: '',
          orgLine: '',
        },
      })
    }

    return { success: true, redirectTo: '/admin' }
  }

  if (
    invitation.invitationType === 'organization' &&
    invitation.organizationId &&
    invitation.targetOrgRole
  ) {
    // Check plan seat limits before adding member
    const allowed = await canAddMember(
      invitation.organizationId,
      invitation.targetOrgRole
    )
    if (!allowed) {
      return { success: false, error: 'seat_limit_reached' }
    }

    await db.insert(organizationMembers).values({
      organizationId: invitation.organizationId,
      userId: authData.user.id,
      role: invitation.targetOrgRole,
      invitedBy: invitation.invitedBy,
      joinedAt: new Date(),
      position: invitation.invitedPosition ?? null,
      departmentId: invitation.invitedDepartmentId ?? null,
      locationId: invitation.invitedLocationId ?? null,
    })

    // Update user name from invitation if provided
    if (invitation.invitedFirstName || invitation.invitedLastName) {
      const fName = invitation.invitedFirstName || data.fullName.split(' ')[0] || ''
      const lName = invitation.invitedLastName || data.fullName.split(' ').slice(1).join(' ') || ''
      await db.update(users).set({
        firstName: fName || null,
        lastName: lName || null,
        updatedAt: new Date(),
      }).where(eq(users.id, authData.user.id))
    }

    // Get org name for notification
    let orgName = ''
    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, invitation.organizationId))
      .limit(1)
    orgName = org?.name ?? ''

    await createNotification({
      recipientId: invitation.invitedBy,
      type: 'invitation.accepted',
      title: `${data.fullName || invitation.email} joined ${orgName}`,
      body: `Role: ${invitation.targetOrgRole}`,
      link: `/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'de'}/admin/organizations/${invitation.organizationId}`,
    })

    // Send email to inviter
    const [regOrgInviter] = await db
      .select({ email: users.email, preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.id, invitation.invitedBy))
      .limit(1)

    if (regOrgInviter) {
      await sendTemplatedEmail({
        to: regOrgInviter.email,
        templateSlug: 'invitation-accepted',
        locale: (regOrgInviter.preferredLocale as 'de' | 'en') || 'de',
        variables: {
          acceptorName: data.fullName || invitation.email,
          acceptorEmail: invitation.email,
          role: invitation.targetOrgRole ?? '',
          orgName,
          orgLine: orgName ? `Organisation: ${orgName}` : '',
        },
        organizationId: invitation.organizationId ?? undefined,
      })
    }

    return { success: true, redirectTo: '/dashboard' }
  }

  return { success: false, error: 'invalid_invitation_type' }
}
