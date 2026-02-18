import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { getGuides, getGuideCategories } from './actions'
import { GuidesPageClient } from './guides-page-client'

export default async function GuidesPage() {
  const ctx = await getCurrentOrgContext()
  const [guides, categories] = await Promise.all([
    getGuides(),
    getGuideCategories(),
  ])

  const isAdmin = ctx?.role === 'org_admin'

  return (
    <GuidesPageClient
      guides={guides}
      categories={categories}
      isAdmin={isAdmin}
    />
  )
}
