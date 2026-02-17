import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getProductById, getProductOrganizations } from '../../actions'
import { PlanDetailClient } from './plan-detail-client'
import { notFound } from 'next/navigation'

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const currentUser = await requirePlatformRole('staff')
  const { id } = await params
  const plan = await getProductById(id)

  if (!plan) {
    notFound()
  }

  const assignedOrgs = await getProductOrganizations(id)

  return (
    <PlanDetailClient
      plan={plan}
      assignedOrgs={assignedOrgs}
      isSuperadmin={currentUser.platformRole === 'superadmin'}
    />
  )
}
