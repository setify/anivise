import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIntegrationSecret } from '@/lib/crypto/secrets'

/**
 * Provide the Deepgram API key for client-side WebSocket connection.
 * Auth-gated: only authenticated users can request the key.
 */
export async function POST() {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Deepgram API key from integration secrets
  const apiKey = await getIntegrationSecret('deepgram', 'api_key')
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Deepgram not configured' },
      { status: 503 }
    )
  }

  return NextResponse.json({ key: apiKey })
}
