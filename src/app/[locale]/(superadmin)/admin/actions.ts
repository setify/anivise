'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  users,
  organizations,
  teamInvitations,
  auditLogs,
  emailTemplates,
  notifications,
} from '@/lib/db/schema'
import { eq, and, isNull, isNotNull, count, desc, sql, like, gte, type SQL } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import {
  updateProfileSchema,
  inviteTeamMemberSchema,
  updateTeamMemberRoleSchema,
  removeTeamMemberSchema,
  createOrganizationSchema,
  deleteOrganizationSchema,
} from '@/lib/validations/admin'
import { logAudit } from '@/lib/audit/log'
import { startImpersonation } from '@/lib/auth/impersonation'
import { setSetting, getSetting, type PlatformSettings } from '@/lib/settings/platform'
import { createNotification } from '@/lib/notifications/create'
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

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'profile.updated',
    entityType: 'user',
    entityId: currentUser.id,
  })

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

  // Check reserved slugs
  const reservedSlugs = await getSetting('org.reserved_slugs')
  if (reservedSlugs.includes(parsed.data.slug)) {
    return { success: false, error: 'This slug is reserved' }
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

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'org.created',
    entityType: 'organization',
    entityId: newOrg.id,
    metadata: { name: newOrg.name, slug: newOrg.slug },
  })

  await createNotification({
    recipientId: 'all_superadmins',
    type: 'org.created',
    title: `Organization "${newOrg.name}" created`,
    body: `Slug: ${newOrg.slug}`,
    link: `/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'de'}/admin/organizations/${newOrg.id}`,
  })

  revalidatePath('/admin/organizations')
  return { success: true, data: newOrg }
}

export async function deleteOrganization(formData: FormData) {
  const currentUser = await requirePlatformRole('superadmin')

  const raw = {
    organizationId: formData.get('organizationId') as string,
  }

  const parsed = deleteOrganizationSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  // Get org name for audit
  const [org] = await db
    .select({ name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, parsed.data.organizationId))
    .limit(1)

  // Soft-delete
  await db
    .update(organizations)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, parsed.data.organizationId))

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'org.deleted',
    entityType: 'organization',
    entityId: parsed.data.organizationId,
    metadata: { name: org?.name, slug: org?.slug },
  })

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

  // Check reserved slugs
  const reservedSlugs = await getSetting('org.reserved_slugs')
  if (reservedSlugs.includes(parsed.data.slug)) {
    return { success: false, error: 'This slug is reserved' }
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
  const expiryDays = await getSetting('invitation.expiry_days')
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

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

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'org.created',
    entityType: 'organization',
    entityId: newOrg.id,
    metadata: { name: newOrg.name, slug: newOrg.slug, adminEmail },
  })

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'org_member.invited',
    entityType: 'invitation',
    organizationId: newOrg.id,
    metadata: { email: adminEmail, role: 'org_admin' },
  })

  await createNotification({
    recipientId: 'all_superadmins',
    type: 'org.created',
    title: `Organization "${newOrg.name}" created`,
    body: `Admin: ${adminEmail}`,
    link: `/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'de'}/admin/organizations/${newOrg.id}`,
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

// ─── Activity Log ───

export async function getAuditLogs(params?: {
  action?: string
  period?: 'day' | 'week' | 'month' | 'all'
  offset?: number
  limit?: number
}) {
  await requirePlatformRole('staff')

  const pageLimit = params?.limit ?? 50
  const pageOffset = params?.offset ?? 0

  // Build conditions array
  const conditions: SQL[] = []

  // Filter by action category (prefix match: "org" matches "org.created", "org.deleted", etc.)
  if (params?.action && params.action !== 'all') {
    conditions.push(like(auditLogs.action, `${params.action}.%`))
  }

  // Filter by time period
  if (params?.period && params.period !== 'all') {
    const now = new Date()
    let since: Date
    switch (params.period) {
      case 'day':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        since = new Date(0)
    }
    conditions.push(gte(auditLogs.createdAt, since))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const logs = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageLimit)
    .offset(pageOffset)

  // Get total count with same filters for pagination
  const [countResult] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(whereClause)

  return {
    logs,
    total: countResult?.value ?? 0,
  }
}

// ─── Platform Settings ───

export async function updatePlatformSettings(
  section: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const allowedKeys: (keyof PlatformSettings)[] = [
      'platform.name',
      'platform.default_locale',
      'platform.default_org_tier',
      'invitation.expiry_days',
      'invitation.max_resends',
      'org.reserved_slugs',
      'org.max_members_trial',
      'analysis.max_transcript_size_mb',
      'analysis.n8n_webhook_url',
    ]

    const changedKeys: string[] = []

    for (const [key, value] of Object.entries(data)) {
      if (!allowedKeys.includes(key as keyof PlatformSettings)) continue
      await setSetting(
        key as keyof PlatformSettings,
        value as PlatformSettings[keyof PlatformSettings],
        currentUser.id
      )
      changedKeys.push(key)
    }

    if (changedKeys.length > 0) {
      await logAudit({
        actorId: currentUser.id,
        actorEmail: currentUser.email,
        action: 'settings.updated',
        entityType: 'platform_settings',
        metadata: { section, changedKeys },
      })
    }

    revalidatePath('/admin/settings')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save settings' }
  }
}

// ─── Impersonation ───

export async function startImpersonationAction(orgId: string, orgName: string) {
  const currentUser = await requirePlatformRole('superadmin')

  await startImpersonation(orgId, orgName, 'org_admin')

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'impersonation.started',
    entityType: 'organization',
    entityId: orgId,
    metadata: { orgName },
  })

  return { success: true }
}

// ─── Email Templates ───

export async function updateEmailTemplate(
  templateId: string,
  data: {
    subjectDe: string
    subjectEn: string
    bodyDe: string
    bodyEn: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [template] = await db
      .select({ slug: emailTemplates.slug })
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1)

    await db
      .update(emailTemplates)
      .set({
        subjectDe: data.subjectDe,
        subjectEn: data.subjectEn,
        bodyDe: data.bodyDe,
        bodyEn: data.bodyEn,
        updatedBy: currentUser.id,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'email_template',
      entityId: templateId,
      metadata: { slug: template?.slug },
    })

    revalidatePath('/admin/settings/emails')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update template' }
  }
}

export async function resetEmailTemplate(
  slug: string
): Promise<{
  success: boolean
  error?: string
  template?: {
    subjectDe: string
    subjectEn: string
    bodyDe: string
    bodyEn: string
  }
}> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    // Seed defaults – hardcoded here as the source of truth for reset
    const defaults: Record<
      string,
      { subjectDe: string; subjectEn: string; bodyDe: string; bodyEn: string }
    > = {
      'team-invitation': {
        subjectDe: 'Sie wurden zum Anivise-Team eingeladen',
        subjectEn: 'You have been invited to the Anivise team',
        bodyDe:
          '<h2>Hallo,</h2><p>{{inviterName}} hat Sie eingeladen, dem Anivise-Plattform-Team als <strong>{{role}}</strong> beizutreten.</p><p><a href="{{inviteLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Einladung annehmen</a></p><p style="color:#666;font-size:14px;">Dieser Link ist {{expiryDays}} Tage gueltig.</p>',
        bodyEn:
          '<h2>Hello,</h2><p>{{inviterName}} has invited you to join the Anivise platform team as <strong>{{role}}</strong>.</p><p><a href="{{inviteLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invitation</a></p><p style="color:#666;font-size:14px;">This link is valid for {{expiryDays}} days.</p>',
      },
      'org-invitation': {
        subjectDe:
          'Sie wurden als Administrator fuer {{orgName}} eingeladen',
        subjectEn:
          'You have been invited as administrator for {{orgName}}',
        bodyDe:
          '<h2>Hallo,</h2><p>{{inviterName}} hat Sie eingeladen, die Organisation <strong>{{orgName}}</strong> auf Anivise als <strong>{{role}}</strong> zu verwalten.</p><p><a href="{{inviteLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Einladung annehmen</a></p><p style="color:#666;font-size:14px;">Dieser Link ist {{expiryDays}} Tage gueltig.</p>',
        bodyEn:
          '<h2>Hello,</h2><p>{{inviterName}} has invited you to manage the organization <strong>{{orgName}}</strong> on Anivise as <strong>{{role}}</strong>.</p><p><a href="{{inviteLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invitation</a></p><p style="color:#666;font-size:14px;">This link is valid for {{expiryDays}} days.</p>',
      },
      welcome: {
        subjectDe: 'Willkommen bei Anivise',
        subjectEn: 'Welcome to Anivise',
        bodyDe:
          '<h2>Willkommen bei Anivise, {{userName}}!</h2><p>Ihr Konto wurde erfolgreich erstellt. Sie koennen sich jetzt anmelden.</p><p><a href="{{loginLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Zur Anmeldung</a></p>',
        bodyEn:
          '<h2>Welcome to Anivise, {{userName}}!</h2><p>Your account has been created successfully. You can now sign in.</p><p><a href="{{loginLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Sign In</a></p>',
      },
      'password-reset': {
        subjectDe: 'Passwort zuruecksetzen',
        subjectEn: 'Reset your password',
        bodyDe:
          '<h2>Hallo {{userName}},</h2><p>Sie haben eine Passwort-Zuruecksetzung angefordert.</p><p><a href="{{resetLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Passwort zuruecksetzen</a></p><p style="color:#666;font-size:14px;">Dieser Link ist {{expiryMinutes}} Minuten gueltig.</p>',
        bodyEn:
          '<h2>Hello {{userName}},</h2><p>You have requested a password reset.</p><p><a href="{{resetLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a></p><p style="color:#666;font-size:14px;">This link is valid for {{expiryMinutes}} minutes.</p>',
      },
      'analysis-complete': {
        subjectDe: 'Analyse fuer {{subjectName}} abgeschlossen',
        subjectEn: 'Analysis for {{subjectName}} completed',
        bodyDe:
          '<h2>Hallo {{userName}},</h2><p>Die Analyse fuer <strong>{{subjectName}}</strong> wurde abgeschlossen. Sie koennen den Bericht jetzt einsehen.</p><p><a href="{{reportLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Bericht ansehen</a></p>',
        bodyEn:
          '<h2>Hello {{userName}},</h2><p>The analysis for <strong>{{subjectName}}</strong> has been completed. You can now view the report.</p><p><a href="{{reportLink}}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">View Report</a></p>',
      },
    }

    const defaultTemplate = defaults[slug]
    if (!defaultTemplate) {
      return { success: false, error: 'No default available for this template' }
    }

    await db
      .update(emailTemplates)
      .set({
        ...defaultTemplate,
        updatedBy: currentUser.id,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.slug, slug))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'email_template',
      metadata: { slug, action: 'reset_to_default' },
    })

    revalidatePath('/admin/settings/emails')
    return { success: true, template: defaultTemplate }
  } catch {
    return { success: false, error: 'Failed to reset template' }
  }
}

// ─── Notifications ───

export async function getRecentNotifications() {
  const currentUser = await requirePlatformRole('staff')

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientId, currentUser.id))
    .orderBy(desc(notifications.createdAt))
    .limit(10)
}

export async function getUnreadCount() {
  const currentUser = await requirePlatformRole('staff')

  const [result] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, currentUser.id),
        eq(notifications.isRead, false)
      )
    )

  return result?.value ?? 0
}

export async function getAllNotifications(params?: {
  unreadOnly?: boolean
  offset?: number
  limit?: number
}) {
  const currentUser = await requirePlatformRole('staff')
  const pageLimit = params?.limit ?? 50
  const pageOffset = params?.offset ?? 0

  const conditions: SQL[] = [eq(notifications.recipientId, currentUser.id)]
  if (params?.unreadOnly) {
    conditions.push(eq(notifications.isRead, false))
  }

  const items = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(pageLimit)
    .offset(pageOffset)

  const [countResult] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(...conditions))

  return { items, total: countResult?.value ?? 0 }
}

export async function markNotificationRead(notificationId: string) {
  const currentUser = await requirePlatformRole('staff')

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.recipientId, currentUser.id)
      )
    )
}

export async function markAllNotificationsRead() {
  const currentUser = await requirePlatformRole('staff')

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.recipientId, currentUser.id),
        eq(notifications.isRead, false)
      )
    )

  revalidatePath('/admin/notifications')
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
