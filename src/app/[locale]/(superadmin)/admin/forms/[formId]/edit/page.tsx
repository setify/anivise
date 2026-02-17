import { notFound } from 'next/navigation'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { getFormById, getCurrentFormVersion } from '../../actions'
import { BuilderLayout } from '@/components/admin/forms/form-builder/builder-layout'
import type { FormSchema } from '@/types/form-schema'

interface EditFormPageProps {
  params: Promise<{ formId: string }>
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  await requirePlatformRole('superadmin')
  const { formId } = await params

  const form = await getFormById(formId)
  if (!form) notFound()

  const version = await getCurrentFormVersion(formId)
  const schema: FormSchema = (version?.schema as unknown as FormSchema) ?? {
    version: '1.0',
    steps: [{ id: crypto.randomUUID(), title: 'Step 1', fields: [] }],
  }

  return <BuilderLayout form={form} initialSchema={schema} />
}
