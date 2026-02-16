import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { CreateOrganizationForm } from './create-org-form'

export default async function NewOrganizationPage() {
  await requirePlatformRole('superadmin')

  return <CreateOrganizationForm />
}
