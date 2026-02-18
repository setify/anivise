import { getSetting } from '@/lib/settings/platform'
import { IntegrationsClient } from './integrations-client'

export default async function IntegrationsPage() {
  const supportEmail = await getSetting('contact.upgrade_email')
  return <IntegrationsClient supportEmail={supportEmail || null} />
}
