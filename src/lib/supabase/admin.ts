import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with the service role key.
 * This bypasses RLS - ONLY use for superadmin operations.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
