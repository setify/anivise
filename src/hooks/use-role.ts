'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OrgRole, PlatformRole } from '@/lib/auth/roles'
import { useUserContext } from '@/contexts/user-context'
import { useTenant } from './use-tenant'

interface RoleContext {
  role: OrgRole | null
  platformRole: PlatformRole | null
  isLoading: boolean
}

/**
 * Client-side hook to get the current user's role in the current organization.
 *
 * Reads from the UserContextProvider first (populated server-side by the dashboard layout).
 * Falls back to Supabase client queries when used outside the provider (e.g. auth pages).
 *
 * This is for UX purposes only (e.g., conditionally showing/hiding UI elements).
 * Server-side role checks are used for actual security enforcement.
 */
export function useRole(): RoleContext {
  const ctx = useUserContext()
  const { organizationSlug } = useTenant()
  const [role, setRole] = useState<OrgRole | null>(ctx?.orgRole ?? null)
  const [platformRole, setPlatformRole] = useState<PlatformRole | null>(ctx?.platformRole ?? null)
  const [isLoading, setIsLoading] = useState(!ctx)

  useEffect(() => {
    // If context is available, no need to fetch
    if (ctx) return

    async function fetchRole() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Check platform_role from users table
      const { data: userData } = await supabase
        .from('users')
        .select('platform_role')
        .eq('id', user.id)
        .single()

      if (userData?.platform_role) {
        setPlatformRole(userData.platform_role as PlatformRole)
      }

      // If we have an org context, fetch org role
      if (organizationSlug) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', organizationSlug)
          .single()

        if (orgData) {
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgData.id)
            .eq('user_id', user.id)
            .single()

          if (memberData) {
            setRole(memberData.role as OrgRole)
          }
        }
      }

      setIsLoading(false)
    }

    fetchRole()
  }, [ctx, organizationSlug])

  return { role, platformRole, isLoading }
}
