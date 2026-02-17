import { db } from '@/lib/db'
import { products, organizationProducts, organizationMembers } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

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
  const [result] = await db
    .select({
      productMaxOrgAdmins: products.maxOrgAdmins,
      productMaxManagers: products.maxManagers,
      productMaxMembers: products.maxMembers,
      productMaxAnalysesPerMonth: products.maxAnalysesPerMonth,
      productMaxForms: products.maxForms,
      productMaxFormSubmissionsPerMonth: products.maxFormSubmissionsPerMonth,
      productMaxStorageMb: products.maxStorageMb,
      overrideMaxOrgAdmins: organizationProducts.overrideMaxOrgAdmins,
      overrideMaxManagers: organizationProducts.overrideMaxManagers,
      overrideMaxMembers: organizationProducts.overrideMaxMembers,
      overrideMaxAnalysesPerMonth: organizationProducts.overrideMaxAnalysesPerMonth,
      overrideMaxForms: organizationProducts.overrideMaxForms,
      overrideMaxFormSubmissionsPerMonth: organizationProducts.overrideMaxFormSubmissionsPerMonth,
      overrideMaxStorageMb: organizationProducts.overrideMaxStorageMb,
    })
    .from(organizationProducts)
    .innerJoin(products, eq(organizationProducts.productId, products.id))
    .where(eq(organizationProducts.organizationId, organizationId))
    .limit(1)

  if (!result) return BLOCKED_LIMITS

  return {
    maxOrgAdmins: result.overrideMaxOrgAdmins ?? result.productMaxOrgAdmins,
    maxManagers: result.overrideMaxManagers ?? result.productMaxManagers,
    maxMembers: result.overrideMaxMembers ?? result.productMaxMembers,
    maxAnalysesPerMonth: result.overrideMaxAnalysesPerMonth ?? result.productMaxAnalysesPerMonth,
    maxForms: result.overrideMaxForms ?? result.productMaxForms,
    maxFormSubmissionsPerMonth: result.overrideMaxFormSubmissionsPerMonth ?? result.productMaxFormSubmissionsPerMonth,
    maxStorageMb: result.overrideMaxStorageMb ?? result.productMaxStorageMb,
  }
}

/**
 * Get current seat usage for an organization.
 */
export async function getOrganizationUsage(
  organizationId: string
): Promise<OrganizationUsage> {
  const roleCounts = await db
    .select({
      role: organizationMembers.role,
      value: count(),
    })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, organizationId))
    .groupBy(organizationMembers.role)

  const countByRole = new Map(roleCounts.map((r) => [r.role, r.value]))

  return {
    orgAdmins: countByRole.get('org_admin') ?? 0,
    managers: countByRole.get('manager') ?? 0,
    members: countByRole.get('member') ?? 0,
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
  const [result] = await db
    .select({
      product: products,
      assignment: organizationProducts,
    })
    .from(organizationProducts)
    .innerJoin(products, eq(organizationProducts.productId, products.id))
    .where(eq(organizationProducts.organizationId, organizationId))
    .limit(1)

  if (!result) return null

  return { product: result.product, assignment: result.assignment }
}
