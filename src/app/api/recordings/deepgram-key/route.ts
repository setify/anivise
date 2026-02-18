import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIntegrationSecret } from '@/lib/crypto/secrets'

/**
 * Generate a temporary Deepgram API key for client-side WebSocket connection.
 * This avoids proxying audio through our server (better for 2h+ recordings).
 * The temp key is scoped and short-lived.
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

  try {
    // Create a temporary key via Deepgram REST API
    const response = await fetch('https://api.deepgram.com/v1/keys', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: `anivise-recording-${user.id}-${Date.now()}`,
        time_to_live_in_seconds: 7500, // ~2h + buffer
        scopes: ['usage:write'],
      }),
    })

    if (!response.ok) {
      // Fallback: return the main key if temp key creation fails
      // (some Deepgram plans don't support key management API)
      return NextResponse.json({ key: apiKey })
    }

    const data = await response.json()
    return NextResponse.json({ key: data.key })
  } catch {
    // Fallback to main key
    return NextResponse.json({ key: apiKey })
  }
}
