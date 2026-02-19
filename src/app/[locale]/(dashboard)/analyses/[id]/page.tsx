import { notFound } from 'next/navigation'
import { getCurrentOrgContext } from '@/lib/auth/org-context'
import {
  getAnalysisById,
  getAnalysisComments,
  getAnalysisShares,
  getAnalysisRecordings,
  getAnalysisDocuments,
  getOrgManagers,
} from '../actions'
import { getAnalysisFormAssignments } from '../form-assignment-actions'
import { AnalysisDetailClient } from './analysis-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AnalysisDetailPage({ params }: Props) {
  const { id } = await params
  const ctx = await getCurrentOrgContext()
  if (!ctx) notFound()

  const [analysis, comments, shares, recordings, documents, managers, formAssignments] = await Promise.all([
    getAnalysisById(id),
    getAnalysisComments(id),
    getAnalysisShares(id),
    getAnalysisRecordings(id),
    getAnalysisDocuments(id),
    getOrgManagers(),
    getAnalysisFormAssignments(id),
  ])

  if (!analysis) notFound()

  const isAdmin = ctx.role === 'org_admin'

  return (
    <AnalysisDetailClient
      analysis={analysis}
      comments={comments}
      shares={shares}
      recordings={recordings}
      documents={documents}
      formAssignments={formAssignments}
      managers={managers}
      isAdmin={isAdmin}
      currentUserId={ctx.userId}
    />
  )
}
