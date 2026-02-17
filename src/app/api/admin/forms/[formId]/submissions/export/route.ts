import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import {
  exportSubmissionsAsCsv,
  exportSubmissionsAsXlsx,
} from '@/lib/forms/export'
import { db } from '@/lib/db'
import { forms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    await requirePlatformRole('staff')

    const { formId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') ?? 'csv'
    const organizationId = searchParams.get('organizationId') ?? undefined
    const fromDate = searchParams.get('fromDate') ?? undefined
    const toDate = searchParams.get('toDate') ?? undefined
    const versionNumber = searchParams.get('version')
      ? Number(searchParams.get('version'))
      : undefined

    const filters = { organizationId, fromDate, toDate, versionNumber }

    // Get form slug for filename
    const [form] = await db
      .select({ slug: forms.slug })
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1)

    const slug = form?.slug ?? 'form'
    const date = new Date().toISOString().split('T')[0]
    const filename = `${slug}_submissions_${date}`

    if (format === 'xlsx') {
      const buffer = await exportSubmissionsAsXlsx(formId, filters)
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      })
    }

    // Default: CSV
    const buffer = await exportSubmissionsAsCsv(formId, filters)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    )
  }
}
