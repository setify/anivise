import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getAllProducts } from '../actions'
import { PlansPageClient } from './plans-page-client'

export default async function PlansPage() {
  const currentUser = await requirePlatformRole('staff')
  const plans = await getAllProducts()

  return (
    <PlansPageClient
      plans={plans}
      isSuperadmin={currentUser.platformRole === 'superadmin'}
    />
  )
}
