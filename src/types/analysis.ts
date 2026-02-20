import type { AnalysisStatus, DossierStatus, AnalysisFormAssignmentStatus } from './database'

// ─── Analysis List & Detail (from actions.ts) ────────────────────────

/** Row returned by getAnalyses() — used in the analysis list view. */
export interface AnalysisRow {
  id: string
  name: string
  employeeId: string
  employeeName: string
  managerId: string
  managerName: string
  status: AnalysisStatus
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

/** Full analysis detail returned by getAnalysisById(). */
export interface AnalysisDetail {
  id: string
  name: string
  status: AnalysisStatus
  archived: boolean
  employeeId: string
  employeeName: string
  employeeEmail: string | null
  employeePosition: string | null
  employeeAvatarUrl: string | null
  managerId: string
  managerName: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// ─── Comments ────────────────────────────────────────────────────────

/** Comment row returned by getAnalysisComments(). */
export interface AnalysisCommentRow {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  createdAt: Date
  updatedAt: Date
  isOwn: boolean
}

// ─── Shares ──────────────────────────────────────────────────────────

/** Share row returned by getAnalysisShares(). */
export interface AnalysisShareRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  userAvatarUrl: string | null
  createdAt: Date
}

// ─── Recordings ──────────────────────────────────────────────────────

/** Recording row returned by getAnalysisRecordings(). */
export interface RecordingRow {
  id: string
  status: string
  language: string
  durationSeconds: number | null
  liveTranscript: string | null
  finalTranscript: string | null
  chunksUploaded: number
  recorderName: string
  createdAt: Date
}

// ─── Documents ───────────────────────────────────────────────────────

/** Document row returned by getAnalysisDocuments(). */
export interface DocumentRow {
  id: string
  name: string
  filename: string
  mimeType: string
  fileSize: number
  extractedText: string | null
  uploaderName: string
  createdAt: Date
}

// ─── Dossiers (AI-generated) ─────────────────────────────────────────

/** Token usage reported by n8n dossier callback. */
export interface DossierTokenUsage {
  prompt_tokens: number
  completion_tokens: number
}

/** Dossier row returned by getAnalysisDossiers(). */
export interface DossierRow {
  id: string
  analysisId: string
  status: DossierStatus
  promptText: string | null
  resultData: Record<string, unknown> | null
  errorMessage: string | null
  modelUsed: string | null
  tokenUsage: DossierTokenUsage | null
  requestedBy: string
  isTest: boolean
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
}

// ─── Form Assignments ────────────────────────────────────────────────

/** Form assignment row returned by getAnalysisFormAssignments(). */
export interface FormAssignmentRow {
  id: string
  analysisId: string
  formId: string
  formTitle: string
  formDescription: string | null
  status: AnalysisFormAssignmentStatus
  dueDate: Date | null
  sentAt: Date | null
  openedAt: Date | null
  completedAt: Date | null
  reminderCount: number
  lastReminderAt: Date | null
  createdAt: Date
  submissionData: Record<string, unknown> | null
  submissionSubmittedAt: Date | null
  formVersionSchema: Record<string, unknown> | null
  employeeName: string
}

/** Available form for assignment (not yet assigned to analysis). */
export interface AvailableForm {
  id: string
  title: string
  description: string | null
}

// ─── Picker types (dropdowns, dialogs) ───────────────────────────────

/** Manager option returned by getOrgManagers(). */
export interface OrgManager {
  userId: string
  name: string
  email: string
  role: string
  isCurrentUser: boolean
}

/** Employee option returned by getActiveEmployees(). */
export interface ActiveEmployee {
  id: string
  name: string
  position: string | null
}

// ─── n8n Webhook Payloads ────────────────────────────────────────────

/** Payload sent to n8n when triggering an analysis job. */
export interface N8nAnalysisTriggerPayload {
  jobId: string
  organizationId: string
  fileUrl: string
  callbackUrl: string
}

/** Payload received from n8n when an analysis job completes. */
export interface N8nAnalysisCompletePayload {
  jobId: string
  organizationId: string
  status: 'completed' | 'failed'
  reportData?: Record<string, unknown>
  reportVersion?: string
  errorMessage?: string
}

/** Payload received from n8n when a dossier generation completes. */
export interface N8nDossierCompletePayload {
  dossierId: string
  organizationId: string
  status: 'completed' | 'failed'
  resultData?: Record<string, unknown>
  modelUsed?: string
  tokenUsage?: DossierTokenUsage
  errorMessage?: string
}

// ─── Mutation results ────────────────────────────────────────────────

/** Standard success/error result from analysis mutations. */
export interface AnalysisMutationResult {
  success: boolean
  error?: string
}

/** Result from createAnalysis(). */
export interface CreateAnalysisResult extends AnalysisMutationResult {
  analysisId?: string
}

/** Result from generateDossier(). */
export interface GenerateDossierResult extends AnalysisMutationResult {
  dossierId?: string
}

/** Result from startRecording(). */
export interface StartRecordingResult extends AnalysisMutationResult {
  recordingId?: string
  storagePath?: string
}
