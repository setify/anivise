import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { PlanForm } from '../plan-form'

export default async function NewPlanPage() {
  await requirePlatformRole('superadmin')

  return <PlanForm />
}
