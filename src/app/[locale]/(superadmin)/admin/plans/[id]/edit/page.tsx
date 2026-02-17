import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getProductById } from '../../../actions'
import { PlanForm } from '../../plan-form'
import { notFound } from 'next/navigation'

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePlatformRole('superadmin')
  const { id } = await params
  const plan = await getProductById(id)

  if (!plan) {
    notFound()
  }

  return <PlanForm plan={plan} />
}
