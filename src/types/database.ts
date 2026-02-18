import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  organizations,
  users,
  organizationMembers,
  orgDepartments,
  orgLocations,
  analysisSubjects,
  consents,
  analysisJobs,
  reports,
  teamInvitations,
  auditLogs,
  platformSettings,
  emailTemplates,
  notifications,
  integrationSecrets,
  forms,
  formVersions,
  formOrganizationAssignments,
  formSubmissions,
  products,
  organizationProducts,
  mediaFiles,
  employees,
  organizationNotificationSettings,
  guideCategories,
  guides,
  analyses,
  analysisShares,
  analysisComments,
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

// Org Department
export type OrgDepartment = InferSelectModel<typeof orgDepartments>
export type NewOrgDepartment = InferInsertModel<typeof orgDepartments>

// Org Location
export type OrgLocation = InferSelectModel<typeof orgLocations>
export type NewOrgLocation = InferInsertModel<typeof orgLocations>

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

// Team Invitation
export type TeamInvitation = InferSelectModel<typeof teamInvitations>
export type NewTeamInvitation = InferInsertModel<typeof teamInvitations>

// Audit Log
export type AuditLog = InferSelectModel<typeof auditLogs>
export type NewAuditLog = InferInsertModel<typeof auditLogs>

// Platform Setting
export type PlatformSetting = InferSelectModel<typeof platformSettings>
export type NewPlatformSetting = InferInsertModel<typeof platformSettings>

// Email Template
export type EmailTemplate = InferSelectModel<typeof emailTemplates>
export type NewEmailTemplate = InferInsertModel<typeof emailTemplates>

// Notification
export type Notification = InferSelectModel<typeof notifications>
export type NewNotification = InferInsertModel<typeof notifications>

// Integration Secret
export type IntegrationSecret = InferSelectModel<typeof integrationSecrets>
export type NewIntegrationSecret = InferInsertModel<typeof integrationSecrets>

// Form
export type Form = InferSelectModel<typeof forms>
export type NewForm = InferInsertModel<typeof forms>

// Form Version
export type FormVersion = InferSelectModel<typeof formVersions>
export type NewFormVersion = InferInsertModel<typeof formVersions>

// Form Organization Assignment
export type FormOrganizationAssignment = InferSelectModel<typeof formOrganizationAssignments>
export type NewFormOrganizationAssignment = InferInsertModel<typeof formOrganizationAssignments>

// Form Submission
export type FormSubmission = InferSelectModel<typeof formSubmissions>
export type NewFormSubmission = InferInsertModel<typeof formSubmissions>

// Product
export type Product = InferSelectModel<typeof products>
export type NewProduct = InferInsertModel<typeof products>

// Organization Product (plan assignment)
export type OrganizationProduct = InferSelectModel<typeof organizationProducts>
export type NewOrganizationProduct = InferInsertModel<typeof organizationProducts>

// Media File
export type MediaFile = InferSelectModel<typeof mediaFiles>
export type NewMediaFile = InferInsertModel<typeof mediaFiles>

// Employee
export type Employee = InferSelectModel<typeof employees>
export type NewEmployee = InferInsertModel<typeof employees>

// Employee Status type
export type EmployeeStatus = 'active' | 'inactive' | 'archived'

// Guide Category
export type GuideCategory = InferSelectModel<typeof guideCategories>
export type NewGuideCategory = InferInsertModel<typeof guideCategories>

// Guide
export type Guide = InferSelectModel<typeof guides>
export type NewGuide = InferInsertModel<typeof guides>

// Analysis
export type Analysis = InferSelectModel<typeof analyses>
export type NewAnalysis = InferInsertModel<typeof analyses>

// Analysis Share
export type AnalysisShare = InferSelectModel<typeof analysisShares>
export type NewAnalysisShare = InferInsertModel<typeof analysisShares>

// Analysis Comment
export type AnalysisComment = InferSelectModel<typeof analysisComments>
export type NewAnalysisComment = InferInsertModel<typeof analysisComments>

// Analysis Status type
export type AnalysisStatus = 'planned' | 'active' | 'completed'

// Media Context type
export type MediaContext =
  | 'email_logo'
  | 'email_template'
  | 'form_header'
  | 'guide'
  | 'org_logo'
  | 'report_asset'
  | 'user_avatar'
  | 'employee_avatar'
  | 'general'

// Organization Notification Settings
export type OrganizationNotificationSettings = InferSelectModel<typeof organizationNotificationSettings>
export type NewOrganizationNotificationSettings = InferInsertModel<typeof organizationNotificationSettings>

// Platform Role type
export type PlatformRole = 'superadmin' | 'staff'
