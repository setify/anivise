import { getCurrentOrgContext } from '@/lib/auth/org-context'
import { redirect } from 'next/navigation'
import { getGuideCategories } from '../actions'
import { CategoriesClient } from './categories-client'

export default async function GuideCategoriesPage() {
  const ctx = await getCurrentOrgContext('org_admin')
  if (!ctx) redirect('/guides')

  const categories = await getGuideCategories()

  return <CategoriesClient categories={categories} />
}
