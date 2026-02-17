import { notFound } from 'next/navigation'
import { getFormBySlugForRendering } from '../actions'
import { FormPageClient } from './form-page-client'

interface FormPageProps {
  params: Promise<{ slug: string }>
}

export default async function FormPage({ params }: FormPageProps) {
  const { slug } = await params

  const result = await getFormBySlugForRendering(slug)

  if (!result) {
    notFound()
  }

  return (
    <FormPageClient
      form={result.form}
      version={result.version}
      schema={result.schema}
      existingSubmission={result.existingSubmission}
    />
  )
}
