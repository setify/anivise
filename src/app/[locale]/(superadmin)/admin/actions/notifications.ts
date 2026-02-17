'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, and, count, desc, type SQL } from 'drizzle-orm'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'

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
