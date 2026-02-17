import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getOrganizationById, getOrganizationProductAction } from '../../../actions'
import { OrgEditClient } from './org-edit-client'
import { notFound } from 'next/navigation'

export default async function OrganizationEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePlatformRole('superadmin')
  const { id } = await params
  const org = await getOrganizationById(id)

  if (!org) {
    notFound()
  }

  const orgProduct = await getOrganizationProductAction(id)

  return <OrgEditClient organization={{ ...org, productName: orgProduct?.productName ?? null }} />
}
