import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getOrganizationById, getOrgInvitations, getOrganizationProductAction } from '../../actions'
import { OrgDetailClient } from './org-detail-client'
import { notFound } from 'next/navigation'

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const currentUser = await requirePlatformRole('staff')
  const { id } = await params
  const org = await getOrganizationById(id)

  if (!org) {
    notFound()
  }

  const [invitations, orgProduct] = await Promise.all([
    getOrgInvitations(id),
    getOrganizationProductAction(id),
  ])

  return (
    <OrgDetailClient
      organization={{ ...org, productName: orgProduct?.productName ?? null }}
      invitations={invitations}
      isSuperadmin={currentUser.platformRole === 'superadmin'}
    />
  )
}
