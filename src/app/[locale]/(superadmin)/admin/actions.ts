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
  analysisJobs,
  products,
  organizationProducts,
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
  updateOrganizationSchema,
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

  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      subscriptionStatus: organizations.subscriptionStatus,
      createdAt: organizations.createdAt,
      productName: products.name,
    })
    .from(organizations)
    .leftJoin(organizationProducts, eq(organizations.id, organizationProducts.organizationId))
    .leftJoin(products, eq(organizationProducts.productId, products.id))
    .where(isNull(organizations.deletedAt))

  return rows
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
    productId: (formData.get('productId') as string) || undefined,
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
    })
    .returning()

  // Assign plan: use provided productId or default from settings
  const productId = parsed.data.productId || (await getSetting('platform.default_product_id'))
  if (productId) {
    await db.insert(organizationProducts).values({
      organizationId: newOrg.id,
      productId,
      assignedBy: currentUser.id,
    })
  }

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'org.created',
    entityType: 'organization',
    entityId: newOrg.id,
    metadata: { name: newOrg.name, slug: newOrg.slug, productId: productId || null },
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

export async function updateOrganization(
  data: {
    id: string
    name: string
    slug: string
    subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired'
    defaultLocale: 'de' | 'en' | null
    internalNotes: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const parsed = updateOrganizationSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: 'Invalid input' }
    }

    // Check reserved slugs
    const reservedSlugs = await getSetting('org.reserved_slugs')
    if (reservedSlugs.includes(parsed.data.slug)) {
      return { success: false, error: 'This slug is reserved' }
    }

    // Check slug uniqueness (excluding current org)
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(
          eq(organizations.slug, parsed.data.slug),
          sql`${organizations.id} != ${parsed.data.id}`
        )
      )
      .limit(1)

    if (existing) {
      return { success: false, error: 'Slug already in use' }
    }

    // Get old values for audit
    const [oldOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, parsed.data.id))
      .limit(1)

    if (!oldOrg) {
      return { success: false, error: 'Organization not found' }
    }

    await db
      .update(organizations)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug,
        subscriptionStatus: parsed.data.subscriptionStatus,
        defaultLocale: parsed.data.defaultLocale,
        internalNotes: parsed.data.internalNotes,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, parsed.data.id))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'org.updated',
      entityType: 'organization',
      entityId: parsed.data.id,
      metadata: {
        changes: {
          ...(oldOrg.name !== parsed.data.name && { name: { from: oldOrg.name, to: parsed.data.name } }),
          ...(oldOrg.slug !== parsed.data.slug && { slug: { from: oldOrg.slug, to: parsed.data.slug } }),
          ...(oldOrg.subscriptionStatus !== parsed.data.subscriptionStatus && {
            subscriptionStatus: { from: oldOrg.subscriptionStatus, to: parsed.data.subscriptionStatus },
          }),
        },
      },
    })

    revalidatePath('/admin/organizations')
    revalidatePath(`/admin/organizations/${parsed.data.id}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update organization' }
  }
}

export async function checkSlugAvailability(
  slug: string,
  excludeOrgId?: string
): Promise<{ available: boolean; reserved?: boolean }> {
  await requirePlatformRole('staff')

  // Check reserved slugs
  const reservedSlugs = await getSetting('org.reserved_slugs')
  if (reservedSlugs.includes(slug)) {
    return { available: false, reserved: true }
  }

  // Check uniqueness
  const conditions = [eq(organizations.slug, slug)]
  if (excludeOrgId) {
    conditions.push(sql`${organizations.id} != ${excludeOrgId}`)
  }

  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(and(...conditions))
    .limit(1)

  return { available: !existing }
}

export async function createOrganizationWithAdmin(formData: FormData) {
  const currentUser = await requirePlatformRole('superadmin')

  const raw = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    productId: (formData.get('productId') as string) || undefined,
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
    })
    .returning()

  // Assign plan: use provided productId or default from settings
  const productId = parsed.data.productId || (await getSetting('platform.default_product_id'))
  if (productId) {
    await db.insert(organizationProducts).values({
      organizationId: newOrg.id,
      productId,
      assignedBy: currentUser.id,
    })
  }

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
      'platform.default_product_id',
      'invitation.expiry_days',
      'invitation.max_resends',
      'org.reserved_slugs',
      'analysis.max_transcript_size_mb',
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

// ─── Test Template Email ───

export async function sendTestTemplateEmail(params: {
  subjectDe: string
  subjectEn: string
  bodyDe: string
  bodyEn: string
  templateId: string
  templateSlug: string
  locale: 'de' | 'en'
}): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const { getEmailLayoutConfig, wrapInBaseLayout } = await import(
      '@/lib/email/send'
    )
    const { getIntegrationSecret } = await import('@/lib/crypto/secrets')

    const layoutConfig = await getEmailLayoutConfig()

    // Use example variables for the test
    const exampleVars: Record<string, string> = {
      inviterName: 'Max Mustermann',
      role: 'Superadmin',
      inviteLink: 'https://app.anivise.com/invite/abc123',
      expiryDays: '7',
      orgName: 'Acme Corp',
      userName: currentUser.email.split('@')[0] || 'User',
      loginLink: 'https://app.anivise.com/login',
      resetLink: 'https://app.anivise.com/reset/abc123',
      expiryMinutes: '60',
      subjectName: 'Thomas Schmidt',
      reportLink: 'https://app.anivise.com/reports/abc123',
    }

    const subject = params.locale === 'de' ? params.subjectDe : params.subjectEn
    const body = params.locale === 'de' ? params.bodyDe : params.bodyEn

    let rendered = body
    let renderedSubject = subject
    for (const [key, value] of Object.entries(exampleVars)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, value)
      renderedSubject = renderedSubject.replace(regex, value)
    }

    const html = wrapInBaseLayout(rendered, params.locale, layoutConfig)

    const apiKey =
      (await getIntegrationSecret('resend', 'api_key')) ||
      process.env.RESEND_API_KEY

    if (!apiKey) {
      return { success: false, error: 'Resend API key not configured' }
    }

    const fromEmail =
      (await getIntegrationSecret('resend', 'from_email')) ||
      process.env.RESEND_FROM_EMAIL ||
      'noreply@anivise.com'
    const fromName =
      (await getIntegrationSecret('resend', 'from_name')) ||
      layoutConfig.platformName ||
      'Anivise'

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: currentUser.email,
      subject: `[TEST] ${renderedSubject}`,
      html,
    })

    // Update last_test_sent_at
    await db
      .update(emailTemplates)
      .set({ lastTestSentAt: new Date() })
      .where(eq(emailTemplates.id, params.templateId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'settings.updated',
      entityType: 'email_template',
      entityId: params.templateId,
      metadata: {
        slug: params.templateSlug,
        action: 'email.test_sent',
        recipient: currentUser.email,
        locale: params.locale,
      },
    })

    revalidatePath('/admin/settings/emails')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send test email',
    }
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

// ─── Analysis Jobs ───

export async function getAnalysisJobs(params?: {
  status?: string
  organizationId?: string
  offset?: number
  limit?: number
}) {
  await requirePlatformRole('staff')

  const pageLimit = params?.limit ?? 50
  const pageOffset = params?.offset ?? 0

  const conditions: SQL[] = []

  if (params?.status && params.status !== 'all') {
    conditions.push(eq(analysisJobs.status, params.status as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'))
  }

  if (params?.organizationId && params.organizationId !== 'all') {
    conditions.push(eq(analysisJobs.organizationId, params.organizationId))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const jobs = await db
    .select({
      id: analysisJobs.id,
      organizationId: analysisJobs.organizationId,
      subjectId: analysisJobs.subjectId,
      requestedBy: analysisJobs.requestedBy,
      status: analysisJobs.status,
      errorMessage: analysisJobs.errorMessage,
      n8nWebhookTriggeredAt: analysisJobs.n8nWebhookTriggeredAt,
      n8nCallbackReceivedAt: analysisJobs.n8nCallbackReceivedAt,
      createdAt: analysisJobs.createdAt,
      updatedAt: analysisJobs.updatedAt,
      orgName: organizations.name,
      orgSlug: organizations.slug,
    })
    .from(analysisJobs)
    .leftJoin(organizations, eq(analysisJobs.organizationId, organizations.id))
    .where(whereClause)
    .orderBy(desc(analysisJobs.createdAt))
    .limit(pageLimit)
    .offset(pageOffset)

  const [countResult] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(whereClause)

  return { jobs, total: countResult?.value ?? 0 }
}

export async function getAnalysisJobStats() {
  await requirePlatformRole('staff')

  const [pending] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'pending'))

  const [processing] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'processing'))

  const [completed] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'completed'))

  const [failed] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'failed'))

  const [cancelled] = await db
    .select({ value: count() })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, 'cancelled'))

  const [total] = await db
    .select({ value: count() })
    .from(analysisJobs)

  return {
    pending: pending?.value ?? 0,
    processing: processing?.value ?? 0,
    completed: completed?.value ?? 0,
    failed: failed?.value ?? 0,
    cancelled: cancelled?.value ?? 0,
    total: total?.value ?? 0,
  }
}

export async function cancelAnalysisJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [job] = await db
      .select({ status: analysisJobs.status, organizationId: analysisJobs.organizationId })
      .from(analysisJobs)
      .where(eq(analysisJobs.id, jobId))
      .limit(1)

    if (!job) {
      return { success: false, error: 'Job not found' }
    }

    if (job.status !== 'pending' && job.status !== 'processing') {
      return { success: false, error: `Cannot cancel job with status: ${job.status}` }
    }

    await db
      .update(analysisJobs)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(analysisJobs.id, jobId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'analysis_job.cancelled',
      entityType: 'analysis_job',
      entityId: jobId,
      organizationId: job.organizationId,
    })

    revalidatePath('/admin/jobs')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to cancel job' }
  }
}

export async function retryAnalysisJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    const [job] = await db
      .select({
        status: analysisJobs.status,
        organizationId: analysisJobs.organizationId,
        transcriptStoragePath: analysisJobs.transcriptStoragePath,
      })
      .from(analysisJobs)
      .where(eq(analysisJobs.id, jobId))
      .limit(1)

    if (!job) {
      return { success: false, error: 'Job not found' }
    }

    if (job.status !== 'failed' && job.status !== 'cancelled') {
      return { success: false, error: `Cannot retry job with status: ${job.status}` }
    }

    // Reset job to pending so it can be picked up again
    await db
      .update(analysisJobs)
      .set({
        status: 'pending',
        errorMessage: null,
        n8nWebhookTriggeredAt: null,
        n8nCallbackReceivedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(analysisJobs.id, jobId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'analysis_job.retried',
      entityType: 'analysis_job',
      entityId: jobId,
      organizationId: job.organizationId,
    })

    // TODO: Re-trigger n8n webhook when integration is fully wired
    // await triggerN8nWebhook({ jobId, organizationId: job.organizationId, ... })

    revalidatePath('/admin/jobs')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to retry job' }
  }
}

export async function checkN8nHealthAction() {
  await requirePlatformRole('staff')

  const { checkN8nHealth } = await import('@/lib/n8n/trigger')
  return checkN8nHealth()
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

// ─── Products (Plans) ───

export async function getActiveProducts() {
  await requirePlatformRole('staff')

  return db
    .select()
    .from(products)
    .where(eq(products.status, 'active'))
    .orderBy(products.sortOrder)
}

export async function getAllProducts() {
  await requirePlatformRole('staff')

  return db
    .select()
    .from(products)
    .orderBy(products.sortOrder)
}

export async function getProductById(id: string) {
  await requirePlatformRole('staff')

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  return product || null
}

export async function getProductOrganizations(productId: string) {
  await requirePlatformRole('staff')

  return db
    .select({
      organizationId: organizationProducts.organizationId,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      assignedAt: organizationProducts.assignedAt,
    })
    .from(organizationProducts)
    .innerJoin(organizations, eq(organizationProducts.organizationId, organizations.id))
    .where(eq(organizationProducts.productId, productId))
}

export async function getProductOrgCount(productId: string): Promise<number> {
  await requirePlatformRole('staff')

  const [result] = await db
    .select({ value: count() })
    .from(organizationProducts)
    .where(eq(organizationProducts.productId, productId))

  return result?.value ?? 0
}

export async function createProduct(data: {
  name: string
  slug: string
  description?: string
  isDefault?: boolean
  sortOrder?: number
  maxOrgAdmins?: number | null
  maxManagers?: number | null
  maxMembers?: number | null
  maxAnalysesPerMonth?: number | null
  maxForms?: number | null
  maxFormSubmissionsPerMonth?: number | null
  maxStorageMb?: number | null
}): Promise<{ success: boolean; error?: string; data?: typeof products.$inferSelect }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    // Validate slug
    const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
    if (!data.slug || !slugRegex.test(data.slug) || data.slug.length < 2) {
      return { success: false, error: 'Invalid slug' }
    }

    // Check slug uniqueness
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, data.slug))
      .limit(1)

    if (existing) {
      return { success: false, error: 'Slug already in use' }
    }

    // If setting as default, unset any existing default
    if (data.isDefault) {
      await db
        .update(products)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(products.isDefault, true))
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        isDefault: data.isDefault ?? false,
        sortOrder: data.sortOrder ?? 0,
        maxOrgAdmins: data.maxOrgAdmins ?? null,
        maxManagers: data.maxManagers ?? null,
        maxMembers: data.maxMembers ?? null,
        maxAnalysesPerMonth: data.maxAnalysesPerMonth ?? null,
        maxForms: data.maxForms ?? null,
        maxFormSubmissionsPerMonth: data.maxFormSubmissionsPerMonth ?? null,
        maxStorageMb: data.maxStorageMb ?? null,
      })
      .returning()

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'plan.assigned',
      entityType: 'product',
      entityId: newProduct.id,
      metadata: { name: newProduct.name, slug: newProduct.slug },
    })

    revalidatePath('/admin/plans')
    return { success: true, data: newProduct }
  } catch {
    return { success: false, error: 'Failed to create plan' }
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string
    slug: string
    description?: string | null
    isDefault?: boolean
    sortOrder?: number
    maxOrgAdmins?: number | null
    maxManagers?: number | null
    maxMembers?: number | null
    maxAnalysesPerMonth?: number | null
    maxForms?: number | null
    maxFormSubmissionsPerMonth?: number | null
    maxStorageMb?: number | null
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    // Validate slug
    const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
    if (!data.slug || !slugRegex.test(data.slug) || data.slug.length < 2) {
      return { success: false, error: 'Invalid slug' }
    }

    // Check slug uniqueness (excluding current product)
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.slug, data.slug),
          sql`${products.id} != ${id}`
        )
      )
      .limit(1)

    if (existing) {
      return { success: false, error: 'Slug already in use' }
    }

    // If setting as default, unset any existing default
    if (data.isDefault) {
      await db
        .update(products)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(products.isDefault, true), sql`${products.id} != ${id}`))
    }

    await db
      .update(products)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        isDefault: data.isDefault ?? false,
        sortOrder: data.sortOrder ?? 0,
        maxOrgAdmins: data.maxOrgAdmins ?? null,
        maxManagers: data.maxManagers ?? null,
        maxMembers: data.maxMembers ?? null,
        maxAnalysesPerMonth: data.maxAnalysesPerMonth ?? null,
        maxForms: data.maxForms ?? null,
        maxFormSubmissionsPerMonth: data.maxFormSubmissionsPerMonth ?? null,
        maxStorageMb: data.maxStorageMb ?? null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'plan.changed',
      entityType: 'product',
      entityId: id,
      metadata: { name: data.name },
    })

    revalidatePath('/admin/plans')
    revalidatePath(`/admin/plans/${id}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update plan' }
  }
}

export async function archiveProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    // Check if any orgs are still on this plan
    const orgCount = await getProductOrgCount(id)
    if (orgCount > 0) {
      return { success: false, error: `Cannot archive: ${orgCount} organization(s) still assigned` }
    }

    await db
      .update(products)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(products.id, id))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'plan.removed',
      entityType: 'product',
      entityId: id,
    })

    revalidatePath('/admin/plans')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to archive plan' }
  }
}

export async function reactivateProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    await db
      .update(products)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(products.id, id))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'plan.assigned',
      entityType: 'product',
      entityId: id,
      metadata: { action: 'reactivated' },
    })

    revalidatePath('/admin/plans')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to reactivate plan' }
  }
}

export async function assignOrganizationPlan(
  organizationId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    // Delete existing assignment if any
    await db
      .delete(organizationProducts)
      .where(eq(organizationProducts.organizationId, organizationId))

    // Create new assignment
    await db.insert(organizationProducts).values({
      organizationId,
      productId,
      assignedBy: currentUser.id,
    })

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'plan.assigned',
      entityType: 'organization_product',
      organizationId,
      metadata: { productId },
    })

    revalidatePath('/admin/organizations')
    revalidatePath(`/admin/organizations/${organizationId}`)
    revalidatePath('/admin/plans')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to assign plan' }
  }
}

export async function removeOrganizationPlan(
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    await db
      .delete(organizationProducts)
      .where(eq(organizationProducts.organizationId, organizationId))

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'plan.removed',
      entityType: 'organization_product',
      organizationId,
    })

    revalidatePath('/admin/organizations')
    revalidatePath(`/admin/organizations/${organizationId}`)
    revalidatePath('/admin/plans')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to remove plan' }
  }
}

export async function getOrganizationProductAction(organizationId: string) {
  await requirePlatformRole('staff')

  const [assignment] = await db
    .select({
      productId: organizationProducts.productId,
      productName: products.name,
      productSlug: products.slug,
      assignedAt: organizationProducts.assignedAt,
    })
    .from(organizationProducts)
    .innerJoin(products, eq(organizationProducts.productId, products.id))
    .where(eq(organizationProducts.organizationId, organizationId))
    .limit(1)

  return assignment || null
}
