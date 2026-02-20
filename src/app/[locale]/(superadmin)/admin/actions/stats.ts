'use server'

import { db } from '@/lib/db'
import {
  organizations,
  users,
  analysisDossiers,
  teamInvitations,
  auditLogs,
} from '@/lib/db/schema'
import { count, isNull, eq, gte, and, or, desc } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

export async function getPlatformStats() {
  await requirePlatformRole('staff')

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Run all queries in parallel
  const [
    orgCountResult,
    orgCountPrevResult,
    userCountResult,
    userCountPrevResult,
    runningDossiersResult,
    newSignupsResult,
    newSignupsPrevResult,
    openInvitationsResult,
    failedDossiersResult,
  ] = await Promise.all([
    // Total organizations (not deleted)
    db.select({ value: count() })
      .from(organizations)
      .where(isNull(organizations.deletedAt)),

    // Orgs created before 7 days ago (for trend)
    db.select({ value: count() })
      .from(organizations)
      .where(and(
        isNull(organizations.deletedAt),
        gte(organizations.createdAt, sevenDaysAgo)
      )),

    // Total active users (not deleted)
    db.select({ value: count() })
      .from(users)
      .where(isNull(users.deletedAt)),

    // Users created in prev 7 days (for trend)
    db.select({ value: count() })
      .from(users)
      .where(and(
        isNull(users.deletedAt),
        gte(users.createdAt, sevenDaysAgo)
      )),

    // Running analyses (pending + processing dossiers)
    db.select({ value: count() })
      .from(analysisDossiers)
      .where(or(
        eq(analysisDossiers.status, 'pending'),
        eq(analysisDossiers.status, 'processing')
      )),

    // New signups (last 7 days)
    db.select({ value: count() })
      .from(users)
      .where(and(
        isNull(users.deletedAt),
        gte(users.createdAt, sevenDaysAgo)
      )),

    // New signups (7-14 days ago, for trend comparison)
    db.select({ value: count() })
      .from(users)
      .where(and(
        isNull(users.deletedAt),
        gte(users.createdAt, fourteenDaysAgo),
        // less than sevenDaysAgo is handled by NOT gte sevenDaysAgo
        // but we need explicit range; simplify by just using the 14-day count minus 7-day
      )),

    // Open invitations (pending)
    db.select({ value: count() })
      .from(teamInvitations)
      .where(eq(teamInvitations.status, 'pending')),

    // Failed dossiers
    db.select({ value: count() })
      .from(analysisDossiers)
      .where(eq(analysisDossiers.status, 'failed')),
  ])

  const totalOrgs = orgCountResult[0]?.value ?? 0
  const newOrgs7d = orgCountPrevResult[0]?.value ?? 0
  const totalUsers = userCountResult[0]?.value ?? 0
  const newUsers7d = userCountPrevResult[0]?.value ?? 0
  const runningAnalyses = runningDossiersResult[0]?.value ?? 0
  const newSignups = newSignupsResult[0]?.value ?? 0
  const newSignups14d = newSignupsPrevResult[0]?.value ?? 0
  const openInvitations = openInvitationsResult[0]?.value ?? 0
  const failedJobs = failedDossiersResult[0]?.value ?? 0

  // Trend: compare last 7d signups vs previous 7d
  const prevPeriodSignups = newSignups14d - newSignups
  const signupTrend = prevPeriodSignups > 0
    ? Math.round(((newSignups - prevPeriodSignups) / prevPeriodSignups) * 100)
    : newSignups > 0
      ? 100
      : 0

  return {
    totalOrganizations: totalOrgs,
    newOrgs7d,
    totalUsers,
    newUsers7d,
    runningAnalyses,
    newSignups,
    signupTrend,
    openInvitations,
    failedJobs,
  }
}

export async function getRecentActivity() {
  await requirePlatformRole('staff')

  const logs = await db
    .select({
      id: auditLogs.id,
      actorEmail: auditLogs.actorEmail,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      createdAt: auditLogs.createdAt,
      metadata: auditLogs.metadata,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(8)

  return logs
}
