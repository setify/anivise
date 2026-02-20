'use client'

import { createContext, useContext } from 'react'
import type { OrgRole, PlatformRole } from '@/lib/auth/roles'

interface UserContextValue {
  orgRole: OrgRole | null
  platformRole: PlatformRole | null
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserContextProvider({
  orgRole,
  platformRole,
  children,
}: UserContextValue & { children: React.ReactNode }) {
  return (
    <UserContext.Provider value={{ orgRole, platformRole }}>
      {children}
    </UserContext.Provider>
  )
}

/**
 * Access the user context provided by the dashboard layout.
 * Returns null when used outside of the UserContextProvider (e.g. auth pages).
 */
export function useUserContext(): UserContextValue | null {
  return useContext(UserContext)
}
