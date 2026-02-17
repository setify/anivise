import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getForms } from './actions'
import { FormListTable } from '@/components/admin/forms/form-list-table'

export default async function FormsPage() {
  await requirePlatformRole('staff')
  const forms = await getForms()

  return (
    <div className="space-y-6 p-6">
      <FormListTable forms={forms} />
    </div>
  )
}
