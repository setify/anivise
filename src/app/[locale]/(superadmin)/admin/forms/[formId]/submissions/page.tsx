import { notFound } from 'next/navigation'
import {
  getFormWithSchema,
  getSubmissionStats,
  getSubmissions,
  getSubmissionOrganizations,
  getFormVersionNumbers,
} from './actions'
import { SubmissionsPageClient } from './submissions-page-client'

interface SubmissionsPageProps {
  params: Promise<{ formId: string }>
}

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
  const { formId } = await params

  const formData = await getFormWithSchema(formId)
  if (!formData) notFound()

  const [stats, submissionsData, orgs, versions] = await Promise.all([
    getSubmissionStats(formId),
    getSubmissions(formId),
    getSubmissionOrganizations(formId),
    getFormVersionNumbers(formId),
  ])

  return (
    <SubmissionsPageClient
      form={formData.form}
      schema={formData.schema}
      stats={stats}
      initialSubmissions={submissionsData.submissions}
      total={submissionsData.total}
      organizations={orgs}
      versions={versions}
    />
  )
}
