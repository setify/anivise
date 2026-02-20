'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { products, organizationProducts, organizations } from '@/lib/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'

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
  allowForms?: boolean
  allowApiAccess?: boolean
  allowCustomBranding?: boolean
  allowEmailTemplates?: boolean
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
        allowForms: data.allowForms ?? true,
        allowApiAccess: data.allowApiAccess ?? false,
        allowCustomBranding: data.allowCustomBranding ?? false,
        allowEmailTemplates: data.allowEmailTemplates ?? false,
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
  } catch (error) {
    console.error('Failed to create plan:', error)
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
    allowForms?: boolean
    allowApiAccess?: boolean
    allowCustomBranding?: boolean
    allowEmailTemplates?: boolean
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
        allowForms: data.allowForms ?? true,
        allowApiAccess: data.allowApiAccess ?? false,
        allowCustomBranding: data.allowCustomBranding ?? false,
        allowEmailTemplates: data.allowEmailTemplates ?? false,
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
  } catch (error) {
    console.error('Failed to update plan:', error)
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
  } catch (error) {
    console.error('Failed to archive plan:', error)
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
  } catch (error) {
    console.error('Failed to reactivate plan:', error)
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
  } catch (error) {
    console.error('Failed to assign organization plan:', error)
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
  } catch (error) {
    console.error('Failed to remove organization plan:', error)
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
