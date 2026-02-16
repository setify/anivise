import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getAllNotifications } from '../actions'
import { NotificationsPageClient } from './notifications-page-client'

export default async function NotificationsPage() {
  await requirePlatformRole('staff')

  const { items, total } = await getAllNotifications({ limit: 50, offset: 0 })

  return (
    <NotificationsPageClient
      initialNotifications={items}
      initialTotal={total}
    />
  )
}
