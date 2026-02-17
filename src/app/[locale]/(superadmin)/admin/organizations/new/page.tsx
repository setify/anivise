import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getActiveProducts } from '../../actions'
import { CreateOrganizationForm } from './create-org-form'

export default async function NewOrganizationPage() {
  await requirePlatformRole('superadmin')
  const products = await getActiveProducts()

  return <CreateOrganizationForm products={products} />
}
