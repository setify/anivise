'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OrgRole } from '@/lib/auth/roles'
import { useTenant } from './use-tenant'

interface RoleContext {
  role: OrgRole | null
  isSuperadmin: boolean
  isLoading: boolean
}

/**
 * Client-side hook to get the current user's role in the current organization.
 *
 * This is for UX purposes only (e.g., conditionally showing/hiding UI elements).
 * Server-side role checks are used for actual security enforcement.
 */
export function useRole(): RoleContext {
  const { organizationSlug } = useTenant()
  const [role, setRole] = useState<OrgRole | null>(null)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Check superadmin flag from users table
      const { data: userData } = await supabase
        .from('users')
        .select('is_superadmin')
        .eq('id', user.id)
        .single()

      if (userData?.is_superadmin) {
        setIsSuperadmin(true)
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
  }, [organizationSlug])

  return { role, isSuperadmin, isLoading }
}
