import { getOrgPlanOverview } from './actions'
import { PlanPageClient } from './plan-page-client'

export default async function PlanPage() {
  const overview = await getOrgPlanOverview()

  return <PlanPageClient overview={overview} />
}
