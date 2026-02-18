'use server'

import { db } from '@/lib/db'
import {
  products,
  organizationProducts,
  formSubmissions,
  analysisJobs,
  forms,
} from '@/lib/db/schema'
import { eq, and, count, gte, isNull } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import {
  getOrganizationLimits,
  getOrganizationUsage,
  type OrganizationLimits,
  type OrganizationUsage,
} from '@/lib/products/limits'

async function getCurrentUserAndOrg() {
  const ctx = await getCurrentOrgContext()
  return {
    userId: ctx?.userId ?? '',
    email: ctx?.email ?? '',
    organizationId: ctx?.organizationId ?? null,
    role: ctx?.role ?? null,
  }
}

export interface PlanOverview {
  planName: string | null
  planDescription: string | null
  limits: OrganizationLimits
  usage: OrganizationUsage & {
    analysesThisMonth: number
    formSubmissionsThisMonth: number
    activeForms: number
  }
}

/**
 * Get the current organization's plan overview (limits + usage).
 */
export async function getOrgPlanOverview(): Promise<PlanOverview | null> {
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return null

  // Get assigned product name
  const [assignment] = await db
    .select({
      productId: organizationProducts.productId,
    })
    .from(organizationProducts)
    .where(eq(organizationProducts.organizationId, organizationId))
    .limit(1)

  let planName: string | null = null
  let planDescription: string | null = null

  if (assignment) {
    const [product] = await db
      .select({ name: products.name, description: products.description })
      .from(products)
      .where(eq(products.id, assignment.productId))
      .limit(1)
    planName = product?.name ?? null
    planDescription = product?.description ?? null
  }

  const [limits, seatUsage] = await Promise.all([
    getOrganizationLimits(organizationId),
    getOrganizationUsage(organizationId),
  ])

  // Get monthly usage counts
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [[analysisCount], [submissionCount], [formCount]] = await Promise.all([
    db
      .select({ value: count() })
      .from(analysisJobs)
      .where(
        and(
          eq(analysisJobs.organizationId, organizationId),
          gte(analysisJobs.createdAt, startOfMonth)
        )
      ),
    db
      .select({ value: count() })
      .from(formSubmissions)
      .where(
        and(
          eq(formSubmissions.organizationId, organizationId),
          gte(formSubmissions.submittedAt, startOfMonth)
        )
      ),
    db
      .select({ value: count() })
      .from(forms)
      .where(
        and(
          eq(forms.organizationId, organizationId),
          isNull(forms.deletedAt)
        )
      ),
  ])

  return {
    planName,
    planDescription,
    limits,
    usage: {
      ...seatUsage,
      analysesThisMonth: analysisCount?.value ?? 0,
      formSubmissionsThisMonth: submissionCount?.value ?? 0,
      activeForms: formCount?.value ?? 0,
    },
  }
}
