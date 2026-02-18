import { getTranslations } from 'next-intl/server'
import { getOrgPlanOverview } from './actions'
import { PlanPageClient } from './plan-page-client'
import { getSetting } from '@/lib/settings/platform'

export default async function PlanPage() {
  const [overview, upgradeEmail] = await Promise.all([
    getOrgPlanOverview(),
    getSetting('contact.upgrade_email'),
  ])

  return <PlanPageClient overview={overview} upgradeEmail={upgradeEmail || null} />
}
