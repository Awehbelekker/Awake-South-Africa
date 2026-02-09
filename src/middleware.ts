import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for multi-tenant detection and routing
 *
 * This middleware:
 * 1. Detects tenant from subdomain or custom domain
 * 2. Passes tenant info to request headers for downstream use
 * 3. Protects master-admin routes
 * 4. Handles API routes with tenant context
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Skip for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Create response with tenant headers
  const response = NextResponse.next()

  // Extract potential tenant identifier
  let tenantSlug: string | null = null
  let isCustomDomain = false

  // Check if this is a custom domain (not subdomain of main platform)
  const mainDomains = ['localhost', 'vercel.app', 'yoursaas.com', '127.0.0.1']
  const isMainDomain = mainDomains.some(d => host.includes(d))

  if (!isMainDomain) {
    // This is a custom domain - we'll look it up in the TenantContext
    isCustomDomain = true
    response.headers.set('x-custom-domain', host)
  } else {
    // Extract subdomain from platform domain
    const subdomain = host.split('.')[0]

    // Skip main domain identifiers
    if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'localhost' && subdomain !== '127') {
      tenantSlug = subdomain
    }
  }

  // Set headers for downstream use (including API routes)
  if (tenantSlug) {
    response.headers.set('x-tenant-slug', tenantSlug)
  }

  if (isCustomDomain) {
    response.headers.set('x-is-custom-domain', 'true')
  }

  // Master admin route protection (basic check - full auth in page)
  if (pathname.startsWith('/master-admin')) {
    // Allow access to dashboard and login
    if (pathname === '/master-admin' || pathname === '/master-admin/login') {
      return response
    }

    // For other master-admin routes, check for auth cookie (basic check)
    const authCookie = request.cookies.get('master_admin_auth')
    if (!authCookie) {
      return NextResponse.redirect(new URL('/master-admin', request.url))
    }
  }

  // Master admin API protection
  if (pathname.startsWith('/api/master-admin')) {
    const authHeader = request.headers.get('authorization')
    const masterKey = process.env.MASTER_ADMIN_API_KEY

    if (!masterKey || authHeader !== `Bearer ${masterKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)',
  ],
}

