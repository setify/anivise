'use server'

import { db } from '@/lib/db'
import { notifications, organizationMembers, organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { logAudit } from '@/lib/audit/log'

export async function getOrganizationsForBroadcast() {
  await requirePlatformRole('staff')
  return db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .orderBy(organizations.name)
}

export async function sendBroadcast(params: {
  title: string
  body: string
  target: 'all_org_admins' | 'org_users'
  organizationId?: string
  link?: string
}): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const currentUser = await requirePlatformRole('superadmin')

    if (!params.title.trim() || !params.body.trim()) {
      return { success: false, error: 'Title and body are required' }
    }

    let recipientIds: string[] = []

    if (params.target === 'all_org_admins') {
      // Get all org admins across all organizations
      const admins = await db
        .select({ userId: organizationMembers.userId })
        .from(organizationMembers)
        .where(eq(organizationMembers.role, 'org_admin'))
      recipientIds = [...new Set(admins.map((a) => a.userId))]
    } else if (params.target === 'org_users' && params.organizationId) {
      // Get all users of a specific organization
      const members = await db
        .select({ userId: organizationMembers.userId })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, params.organizationId))
      recipientIds = members.map((m) => m.userId)
    } else {
      return { success: false, error: 'Invalid target' }
    }

    if (recipientIds.length === 0) {
      return { success: true, sent: 0 }
    }

    // Insert notifications for all recipients
    const notificationRows = recipientIds.map((recipientId) => ({
      recipientId,
      type: 'system.broadcast',
      title: params.title,
      body: params.body,
      link: params.link || null,
      isRead: false,
    }))

    await db.insert(notifications).values(notificationRows)

    await logAudit({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'notification.broadcast',
      entityType: 'notification',
      metadata: {
        target: params.target,
        organizationId: params.organizationId,
        recipientCount: recipientIds.length,
        title: params.title,
      },
    })

    return { success: true, sent: recipientIds.length }
  } catch (error) {
    console.error('Failed to send broadcast:', error)
    return { success: false, error: 'Failed to send broadcast' }
  }
}
