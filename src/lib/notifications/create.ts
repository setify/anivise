import { db } from '@/lib/db'
import { notifications, users } from '@/lib/db/schema'
import { isNotNull, eq } from 'drizzle-orm'

export type NotificationType =
  | 'org.created'
  | 'invitation.accepted'
  | 'invitation.expired'
  | 'team.member_joined'
  | 'analysis.completed'
  | 'analysis.failed'
  | 'system.info'

export async function createNotification(params: {
  recipientId: string | 'all_superadmins'
  type: NotificationType
  title: string
  body?: string
  link?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  if (params.recipientId === 'all_superadmins') {
    // Broadcast to all superadmins
    const superadmins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.platformRole, 'superadmin'))

    if (superadmins.length > 0) {
      await db.insert(notifications).values(
        superadmins.map((admin) => ({
          recipientId: admin.id,
          type: params.type,
          title: params.title,
          body: params.body ?? null,
          link: params.link ?? null,
          metadata: params.metadata ?? null,
        }))
      )
    }
  } else {
    await db.insert(notifications).values({
      recipientId: params.recipientId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      link: params.link ?? null,
      metadata: params.metadata ?? null,
    })
  }
}
