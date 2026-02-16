import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  organizations,
  users,
  organizationMembers,
  analysisSubjects,
  consents,
  analysisJobs,
  reports,
} from '@/lib/db/schema'

// Organization
export type Organization = InferSelectModel<typeof organizations>
export type NewOrganization = InferInsertModel<typeof organizations>

// User
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

// Organization Member
export type OrganizationMember = InferSelectModel<typeof organizationMembers>
export type NewOrganizationMember = InferInsertModel<typeof organizationMembers>

// Analysis Subject
export type AnalysisSubject = InferSelectModel<typeof analysisSubjects>
export type NewAnalysisSubject = InferInsertModel<typeof analysisSubjects>

// Consent
export type Consent = InferSelectModel<typeof consents>
export type NewConsent = InferInsertModel<typeof consents>

// Analysis Job
export type AnalysisJob = InferSelectModel<typeof analysisJobs>
export type NewAnalysisJob = InferInsertModel<typeof analysisJobs>

// Report
export type Report = InferSelectModel<typeof reports>
export type NewReport = InferInsertModel<typeof reports>
