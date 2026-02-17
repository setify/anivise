'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  organizations,
  teamInvitations,
  products,
  organizationProducts,
} from '@/lib/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import {
  createOrganizationSchema,
  deleteOrganizationSchema,
  updateOrganizationSchema,
} from '@/lib/validations/admin'
import { logAudit } from '@/lib/audit/log'
import { getSetting } from '@/lib/settings/platform'
import { createNotification } from '@/lib/notifications/create'
import crypto from 'crypto'

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
  } catch (error) {
    console.error('Failed to update organization:', error)
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
