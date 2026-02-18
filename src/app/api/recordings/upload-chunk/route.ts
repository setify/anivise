import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { db } from '@/lib/db'
import { analysisRecordings, analyses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentOrgContext } from '@/lib/auth/org-context'

/**
 * Upload an audio chunk during recording.
 * Each chunk is appended to storage under the recording path.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const recordingId = formData.get('recordingId') as string
  const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10)
  const chunk = formData.get('chunk') as File

  if (!recordingId || isNaN(chunkIndex) || !chunk) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify recording exists
  const [recording] = await db
    .select()
    .from(analysisRecordings)
    .where(eq(analysisRecordings.id, recordingId))
    .limit(1)

  if (!recording || recording.recordedBy !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Upload chunk to storage
  const adminSupabase = createAdminClient()
  const chunkPath = `${recording.storagePath}/chunk-${String(chunkIndex).padStart(4, '0')}.webm`
  const bytes = await chunk.arrayBuffer()

  const { error: uploadError } = await adminSupabase.storage
    .from('org-assets')
    .upload(chunkPath, bytes, {
      contentType: 'audio/webm',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }

  // Update chunk count
  await db
    .update(analysisRecordings)
    .set({
      chunksUploaded: chunkIndex + 1,
      updatedAt: new Date(),
    })
    .where(eq(analysisRecordings.id, recordingId))

  return NextResponse.json({ success: true, chunkIndex })
}
