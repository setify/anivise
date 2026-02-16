'use client'

import { useEffect, useState } from 'react'

interface TenantContext {
  organizationSlug: string | null
  isLoading: boolean
}

/**
 * Client-side hook to get the current organization context.
 * Reads the organization slug from:
 * 1. The URL query parameter (?org=slug) in development
 * 2. The subdomain in production (resolved by middleware)
 *
 * For server components, use the x-organization-slug header set by middleware.
 */
export function useTenant(): TenantContext {
  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const hostname = window.location.hostname
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'
    const baseDomain = appDomain.replace(/:\d+$/, '')

    // Production: extract subdomain
    if (baseDomain !== 'localhost' && baseDomain !== '127.0.0.1') {
      if (hostname.endsWith(`.${baseDomain}`)) {
        const sub = hostname.slice(0, -(baseDomain.length + 1))
        if (sub && sub !== 'admin') {
          setOrganizationSlug(sub)
        }
      }
    } else {
      // Development: read from URL query param
      const params = new URLSearchParams(window.location.search)
      const orgParam = params.get('org')
      if (orgParam) {
        setOrganizationSlug(orgParam)
      }
    }

    setIsLoading(false)
  }, [])

  return { organizationSlug, isLoading }
}
