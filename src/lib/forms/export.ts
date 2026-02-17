import { db } from '@/lib/db'
import {
  forms,
  formVersions,
  formSubmissions,
  organizations,
  users,
} from '@/lib/db/schema'
import { eq, and, desc, gte, lte, isNull } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import type { FormSchema, FormField } from '@/types/form-schema'

export interface SubmissionFilters {
  organizationId?: string
  fromDate?: string
  toDate?: string
  versionNumber?: number
}

interface SubmissionRow {
  [key: string]: unknown
}

async function getSubmissionsData(
  formId: string,
  filters?: SubmissionFilters
) {
  // Get form
  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), isNull(forms.deletedAt)))
    .limit(1)

  if (!form) throw new Error('Form not found')

  // Get latest version for field labels
  const [latestVersion] = await db
    .select()
    .from(formVersions)
    .where(
      and(
        eq(formVersions.formId, formId),
        eq(formVersions.versionNumber, form.currentVersion)
      )
    )
    .limit(1)

  if (!latestVersion) throw new Error('Form version not found')

  const schema = latestVersion.schema as unknown as FormSchema

  // Build conditions
  const conditions = [eq(formSubmissions.formId, formId)]
  if (filters?.organizationId) {
    conditions.push(eq(formSubmissions.organizationId, filters.organizationId))
  }
  if (filters?.fromDate) {
    conditions.push(gte(formSubmissions.submittedAt, new Date(filters.fromDate)))
  }
  if (filters?.toDate) {
    conditions.push(lte(formSubmissions.submittedAt, new Date(filters.toDate)))
  }

  // Get submissions with org and user info
  const subs = await db
    .select({
      id: formSubmissions.id,
      data: formSubmissions.data,
      metadata: formSubmissions.metadata,
      submittedAt: formSubmissions.submittedAt,
      orgName: organizations.name,
      userName: users.fullName,
      userEmail: users.email,
      versionNumber: formVersions.versionNumber,
    })
    .from(formSubmissions)
    .leftJoin(organizations, eq(formSubmissions.organizationId, organizations.id))
    .leftJoin(users, eq(formSubmissions.submittedBy, users.id))
    .leftJoin(formVersions, eq(formSubmissions.formVersionId, formVersions.id))
    .where(and(...conditions))
    .orderBy(desc(formSubmissions.submittedAt))

  // Filter by version if needed
  const filteredSubs = filters?.versionNumber
    ? subs.filter((s) => s.versionNumber === filters.versionNumber)
    : subs

  // Get all fields across all steps
  const allFields: FormField[] = schema.steps.flatMap((step) => step.fields)

  return { form, schema, allFields, submissions: filteredSubs }
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

function buildRows(
  allFields: FormField[],
  submissions: Awaited<ReturnType<typeof getSubmissionsData>>['submissions']
): { headers: string[]; rows: SubmissionRow[] } {
  const fieldHeaders = allFields
    .filter((f) => f.type !== 'hidden')
    .map((f) => ({ id: f.id, label: f.label || f.id }))

  const headers = [
    ...fieldHeaders.map((h) => h.label),
    'Organization',
    'Submitted By',
    'Email',
    'Submitted At',
    'Version',
  ]

  const rows = submissions.map((sub) => {
    const data = (sub.data ?? {}) as Record<string, unknown>
    const row: SubmissionRow = {}

    for (const fh of fieldHeaders) {
      row[fh.label] = formatFieldValue(data[fh.id])
    }

    row['Organization'] = sub.orgName ?? ''
    row['Submitted By'] = sub.userName ?? ''
    row['Email'] = sub.userEmail ?? ''
    row['Submitted At'] = sub.submittedAt
      ? new Date(sub.submittedAt).toISOString()
      : ''
    row['Version'] = sub.versionNumber ? `v${sub.versionNumber}` : ''

    return row
  })

  return { headers, rows }
}

export async function exportSubmissionsAsCsv(
  formId: string,
  filters?: SubmissionFilters
): Promise<Buffer> {
  const { allFields, submissions } = await getSubmissionsData(formId, filters)
  const { headers, rows } = buildRows(allFields, submissions)

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers })
  const csv = XLSX.utils.sheet_to_csv(ws)

  return Buffer.from(csv, 'utf-8')
}

export async function exportSubmissionsAsXlsx(
  formId: string,
  filters?: SubmissionFilters
): Promise<Buffer> {
  const { form, allFields, submissions } = await getSubmissionsData(formId, filters)
  const { headers, rows } = buildRows(allFields, submissions)

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers })

  // Set column widths
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length, 15) }))

  XLSX.utils.book_append_sheet(wb, ws, form.title.slice(0, 31))

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(buf)
}
