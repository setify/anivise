import { redirect } from 'next/navigation'
import { getOrgEmailTemplates, getOrgEmailLayoutConfigAction } from './actions'
import { OrgEmailTemplatesClient } from './org-email-templates-client'

export default async function OrgEmailTemplatesPage() {
  const [templates, layoutConfig] = await Promise.all([
    getOrgEmailTemplates(),
    getOrgEmailLayoutConfigAction(),
  ])

  if (!layoutConfig) redirect('/dashboard')

  return (
    <OrgEmailTemplatesClient
      templates={templates}
      layoutConfig={layoutConfig}
    />
  )
}
