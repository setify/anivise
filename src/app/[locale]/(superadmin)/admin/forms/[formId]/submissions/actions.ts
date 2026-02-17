'use server'

import { db } from '@/lib/db'
import {
  forms,
  formVersions,
  formSubmissions,
  organizations,
  users,
} from '@/lib/db/schema'
import { eq, and, desc, gte, lte, isNull, count, sql } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'
import type { FormSchema } from '@/types/form-schema'

export interface SubmissionFilters {
  organizationId?: string
  fromDate?: string
  toDate?: string
  versionNumber?: number
  page?: number
  perPage?: number
}

// ─── Get Form with Schema ───

export async function getFormWithSchema(formId: string) {
  await requirePlatformRole('staff')

  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
    .limit(1)

  if (!form) return null

  const [version] = await db
    .select()
    .from(formVersions)
    .where(
      and(
        eq(formVersions.formId, formId),
        eq(formVersions.versionNumber, form.currentVersion)
      )
    )
    .limit(1)

  return {
    form,
    schema: (version?.schema ?? { version: '1.0', steps: [] }) as unknown as FormSchema,
  }
}

// ─── Get Submission Stats ───

export async function getSubmissionStats(formId: string) {
  await requirePlatformRole('staff')

  const [total] = await db
    .select({ count: count() })
    .from(formSubmissions)
    .where(eq(formSubmissions.formId, formId))

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [thisWeek] = await db
    .select({ count: count() })
    .from(formSubmissions)
    .where(
      and(
        eq(formSubmissions.formId, formId),
        gte(formSubmissions.submittedAt, weekAgo)
      )
    )

  // Average duration from metadata
  const allMeta = await db
    .select({ metadata: formSubmissions.metadata })
    .from(formSubmissions)
    .where(eq(formSubmissions.formId, formId))

  let totalDuration = 0
  let durationCount = 0
  for (const row of allMeta) {
    const meta = row.metadata as Record<string, unknown> | null
    if (meta?.duration && typeof meta.duration === 'number') {
      totalDuration += meta.duration
      durationCount++
    }
  }

  const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0

  return {
    total: total?.count ?? 0,
    thisWeek: thisWeek?.count ?? 0,
    avgDuration,
  }
}

// ─── Get Submissions ───

export async function getSubmissions(formId: string, filters?: SubmissionFilters) {
  await requirePlatformRole('staff')

  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 50
  const offset = (page - 1) * perPage

  const conditions = [eq(formSubmissions.formId, formId)]
  if (filters?.organizationId) {
    conditions.push(eq(formSubmissions.organizationId, filters.organizationId))
  }
  if (filters?.fromDate) {
    conditions.push(gte(formSubmissions.submittedAt, new Date(filters.fromDate)))
  }
  if (filters?.toDate) {
    conditions.push(lte(formSubmissions.submittedAt, new Date(filters.toDate)))
  }

  const [totalCount] = await db
    .select({ count: count() })
    .from(formSubmissions)
    .where(and(...conditions))

  let query = db
    .select({
      id: formSubmissions.id,
      data: formSubmissions.data,
      metadata: formSubmissions.metadata,
      submittedAt: formSubmissions.submittedAt,
      orgId: formSubmissions.organizationId,
      orgName: organizations.name,
      userName: users.fullName,
      userEmail: users.email,
      versionNumber: formVersions.versionNumber,
    })
    .from(formSubmissions)
    .leftJoin(organizations, eq(formSubmissions.organizationId, organizations.id))
    .leftJoin(users, eq(formSubmissions.submittedBy, users.id))
    .leftJoin(formVersions, eq(formSubmissions.formVersionId, formVersions.id))
    .where(and(...conditions))
    .orderBy(desc(formSubmissions.submittedAt))
    .limit(perPage)
    .offset(offset)

  const subs = await query

  // Filter by version if needed (post-query since it's a join)
  const filteredSubs = filters?.versionNumber
    ? subs.filter((s) => s.versionNumber === filters.versionNumber)
    : subs

  return {
    submissions: filteredSubs,
    total: totalCount?.count ?? 0,
    page,
    perPage,
  }
}

// ─── Get Organizations for Filter ───

export async function getSubmissionOrganizations(formId: string) {
  await requirePlatformRole('staff')

  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
    })
    .from(formSubmissions)
    .innerJoin(organizations, eq(formSubmissions.organizationId, organizations.id))
    .where(eq(formSubmissions.formId, formId))
    .groupBy(organizations.id, organizations.name)
    .orderBy(organizations.name)

  return orgs
}

// ─── Get Form Versions for Filter ───

export async function getFormVersionNumbers(formId: string) {
  await requirePlatformRole('staff')

  const versions = await db
    .select({
      versionNumber: formVersions.versionNumber,
      publishedAt: formVersions.publishedAt,
    })
    .from(formVersions)
    .where(eq(formVersions.formId, formId))
    .orderBy(desc(formVersions.versionNumber))

  return versions
}

// ─── Delete Submission ───

export async function deleteSubmission(submissionId: string) {
  const currentUser = await requirePlatformRole('superadmin')

  const [sub] = await db
    .select({ formId: formSubmissions.formId })
    .from(formSubmissions)
    .where(eq(formSubmissions.id, submissionId))
    .limit(1)

  if (!sub) return { success: false, error: 'Submission not found' }

  await db
    .delete(formSubmissions)
    .where(eq(formSubmissions.id, submissionId))

  await logAudit({
    actorId: currentUser.id,
    actorEmail: currentUser.email,
    action: 'settings.updated',
    entityType: 'form_submission',
    entityId: submissionId,
    metadata: { action: 'submission.deleted', formId: sub.formId },
  })

  return { success: true }
}
