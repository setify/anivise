import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { FormMetaForm } from '@/components/admin/forms/form-meta-form'

export default async function NewFormPage() {
  await requirePlatformRole('superadmin')

  return (
    <div className="p-6">
      <FormMetaForm />
    </div>
  )
}
