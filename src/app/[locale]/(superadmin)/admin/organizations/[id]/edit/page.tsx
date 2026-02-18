import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getOrganizationById, getOrganizationProductAction, getActiveProducts } from '../../../actions'
import { OrgEditClient } from './org-edit-client'
import { notFound } from 'next/navigation'

export default async function OrganizationEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePlatformRole('superadmin')
  const { id } = await params

  const [org, orgProduct, activeProducts] = await Promise.all([
    getOrganizationById(id),
    getOrganizationProductAction(id),
    getActiveProducts(),
  ])

  if (!org) {
    notFound()
  }

  return (
    <OrgEditClient
      organization={{ ...org, productName: orgProduct?.productName ?? null }}
      currentProductId={orgProduct?.productId ?? null}
      availableProducts={activeProducts.map((p) => ({ id: p.id, name: p.name }))}
    />
  )
}
