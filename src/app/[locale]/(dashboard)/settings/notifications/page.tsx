import { redirect } from 'next/navigation'
import { getOrgNotificationSettings } from './actions'
import { NotificationsClient } from './notifications-client'

export default async function NotificationsPage() {
  const data = await getOrgNotificationSettings()
  if (!data) redirect('/dashboard')
  return <NotificationsClient data={data} />
}
