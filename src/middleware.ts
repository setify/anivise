import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from '@/lib/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

/** Routes that do not require authentication */
const PUBLIC_PATTERNS = [
  /^\/(de|en)\/login(\/|$)/,
  /^\/(de|en)\/register(\/|$)/,
  /^\/api\//,
]

/** Check if a pathname is public (no auth required) */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname))
}

/** Extract subdomain from the hostname */
function getSubdomain(hostname: string): string | null {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'
  // Remove port for comparison
  const baseDomain = appDomain.replace(/:\d+$/, '')
  const hostWithoutPort = hostname.replace(/:\d+$/, '')

  // localhost / development: no subdomains
  if (baseDomain === 'localhost' || baseDomain === '127.0.0.1') {
    return null
  }

  // Production: extract subdomain from hostname
  // e.g. acme.anivise.com → "acme", admin.anivise.com → "admin"
  if (hostWithoutPort.endsWith(`.${baseDomain}`)) {
    const sub = hostWithoutPort.slice(0, -(baseDomain.length + 1))
    return sub || null
  }

  return null
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // ──────────────────────────────────────────────
  // 1. LOCALE DETECTION (next-intl)
  // ──────────────────────────────────────────────
  // Let next-intl handle locale detection and rewriting first.
  // We apply it and then layer our logic on top of its response.
  const intlResponse = intlMiddleware(request)

  // ──────────────────────────────────────────────
  // 2. SUBDOMAIN RESOLUTION
  // ──────────────────────────────────────────────
  const subdomain = getSubdomain(hostname)
  // In development, allow an x-organization-slug header or query param as fallback
  const devOrgSlug =
    request.headers.get('x-organization-slug') ||
    request.nextUrl.searchParams.get('org') ||
    null

  const orgSlug = subdomain || devOrgSlug

  // Propagate organization slug downstream via request header
  if (orgSlug) {
    intlResponse.headers.set('x-organization-slug', orgSlug)
  }

  // If the subdomain is "admin", mark as superadmin route
  if (subdomain === 'admin') {
    intlResponse.headers.set('x-is-admin-subdomain', 'true')
  }

  // ──────────────────────────────────────────────
  // 3. AUTH CHECK (Supabase session refresh)
  // ──────────────────────────────────────────────
  // Skip auth check for static assets / internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return intlResponse
  }

  // Refresh Supabase session (keeps auth tokens fresh for Server Components)
  const { supabaseResponse, user } = await updateSession(request)

  // Merge cookies from Supabase response into intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    })
  })

  // Set user info header for downstream server components
  if (user) {
    intlResponse.headers.set('x-user-id', user.id)
    intlResponse.headers.set('x-user-email', user.email || '')
  }

  // Determine the effective pathname (after next-intl rewrite)
  const effectivePathname = pathname

  // If the route is public, allow through
  if (isPublicRoute(effectivePathname)) {
    return intlResponse
  }

  // If the route is protected and user is not authenticated, redirect to login
  if (!user) {
    const locale = effectivePathname.match(/^\/(de|en)/)?.[1] || routing.defaultLocale
    const loginUrl = new URL(`/${locale}/login`, request.url)
    // Preserve the originally requested URL so we can redirect back after login
    loginUrl.searchParams.set('redirectTo', effectivePathname)
    return NextResponse.redirect(loginUrl)
  }

  return intlResponse
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
