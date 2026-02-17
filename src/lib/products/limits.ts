import { db } from '@/lib/db'
import { products, organizationProducts, organizationMembers } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'

export interface OrganizationLimits {
  maxOrgAdmins: number | null
  maxManagers: number | null
  maxMembers: number | null
  maxAnalysesPerMonth: number | null
  maxForms: number | null
  maxFormSubmissionsPerMonth: number | null
  maxStorageMb: number | null
}

export interface OrganizationUsage {
  orgAdmins: number
  managers: number
  members: number
}

const BLOCKED_LIMITS: OrganizationLimits = {
  maxOrgAdmins: 0,
  maxManagers: 0,
  maxMembers: 0,
  maxAnalysesPerMonth: 0,
  maxForms: 0,
  maxFormSubmissionsPerMonth: 0,
  maxStorageMb: 0,
}

/**
 * Resolve effective limits for an organization.
 * Priority: override value > product default > null (unlimited)
 * If no plan is assigned, returns 0 for all limits (blocked).
 */
export async function getOrganizationLimits(
  organizationId: string
): Promise<OrganizationLimits> {
  const [assignment] = await db
    .select()
    .from(organizationProducts)
    .where(eq(organizationProducts.organizationId, organizationId))
    .limit(1)

  if (!assignment) return BLOCKED_LIMITS

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, assignment.productId))
    .limit(1)

  if (!product) return BLOCKED_LIMITS

  return {
    maxOrgAdmins: assignment.overrideMaxOrgAdmins ?? product.maxOrgAdmins,
    maxManagers: assignment.overrideMaxManagers ?? product.maxManagers,
    maxMembers: assignment.overrideMaxMembers ?? product.maxMembers,
    maxAnalysesPerMonth: assignment.overrideMaxAnalysesPerMonth ?? product.maxAnalysesPerMonth,
    maxForms: assignment.overrideMaxForms ?? product.maxForms,
    maxFormSubmissionsPerMonth: assignment.overrideMaxFormSubmissionsPerMonth ?? product.maxFormSubmissionsPerMonth,
    maxStorageMb: assignment.overrideMaxStorageMb ?? product.maxStorageMb,
  }
}

/**
 * Get current seat usage for an organization.
 */
export async function getOrganizationUsage(
  organizationId: string
): Promise<OrganizationUsage> {
  const roles = ['org_admin', 'manager', 'member'] as const

  const counts = await Promise.all(
    roles.map(async (role) => {
      const [result] = await db
        .select({ value: count() })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.role, role)
          )
        )
      return result?.value ?? 0
    })
  )

  return {
    orgAdmins: counts[0],
    managers: counts[1],
    members: counts[2],
  }
}

/**
 * Check if a specific limit allows a given count.
 * Returns true if within limit. null limit means unlimited.
 */
export function checkLimit(limit: number | null, current: number): boolean {
  if (limit === null) return true
  return current < limit
}

/**
 * Check if a new member with the given role can be added.
 */
export async function canAddMember(
  organizationId: string,
  role: 'org_admin' | 'manager' | 'member'
): Promise<boolean> {
  const [limits, usage] = await Promise.all([
    getOrganizationLimits(organizationId),
    getOrganizationUsage(organizationId),
  ])

  switch (role) {
    case 'org_admin':
      return checkLimit(limits.maxOrgAdmins, usage.orgAdmins)
    case 'manager':
      return checkLimit(limits.maxManagers, usage.managers)
    case 'member':
      return checkLimit(limits.maxMembers, usage.members)
  }
}

/**
 * Get the product assigned to an organization, or null if none.
 */
export async function getOrganizationProduct(
  organizationId: string
): Promise<{ product: typeof products.$inferSelect; assignment: typeof organizationProducts.$inferSelect } | null> {
  const [assignment] = await db
    .select()
    .from(organizationProducts)
    .where(eq(organizationProducts.organizationId, organizationId))
    .limit(1)

  if (!assignment) return null

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, assignment.productId))
    .limit(1)

  if (!product) return null

  return { product, assignment }
}
