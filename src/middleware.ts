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

  // Build forwarded request headers (these reach API routes and server components)
  const requestHeaders = new Headers(request.headers)

  // Extract potential tenant identifier
  let tenantSlug: string | null = null
  let isCustomDomain = false

  // Check if this is a custom domain (not subdomain of main platform)
  const mainDomains = ['localhost', 'vercel.app', 'yoursaas.com', '127.0.0.1']
  const isMainDomain = mainDomains.some(d => host.includes(d))

  if (!isMainDomain) {
    // Strip www prefix so both awakesa.co.za and www.awakesa.co.za resolve the same tenant
    const cleanHost = host.replace(/^www\./, '')
    isCustomDomain = true
    requestHeaders.set('x-custom-domain', cleanHost)
    requestHeaders.set('x-is-custom-domain', 'true')
  } else {
    // Extract subdomain from platform domain
    const subdomain = host.split('.')[0]
    if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'localhost' && subdomain !== '127') {
      tenantSlug = subdomain
      requestHeaders.set('x-tenant-slug', tenantSlug)
    }
  }

  // Master admin route protection
  if (pathname.startsWith('/master-admin')) {
    if (pathname === '/master-admin' || pathname === '/master-admin/login') {
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
    const authCookie = request.cookies.get('master_admin_auth')
    if (!authCookie) {
      return NextResponse.redirect(new URL('/master-admin', request.url))
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)' ,
  ],
}

