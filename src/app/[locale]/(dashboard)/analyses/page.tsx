import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { getAnalyses, getActiveEmployees, getOrgManagers } from './actions'
import { AnalysesPageClient } from './analyses-page-client'

export default async function AnalysesPage() {
  const ctx = await getCurrentOrgContext()
  const [analyses, employees, managers] = await Promise.all([
    getAnalyses(),
    getActiveEmployees(),
    getOrgManagers(),
  ])

  const isAdmin = ctx?.role === 'org_admin'

  return (
    <AnalysesPageClient
      analyses={analyses}
      employees={employees}
      managers={managers}
      isAdmin={isAdmin}
      currentUserId={ctx?.userId ?? ''}
    />
  )
}
