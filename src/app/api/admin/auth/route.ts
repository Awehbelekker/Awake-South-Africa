export const dynamic = 'force-dynamic'

/**
 * Admin Authentication API (server-side, bcrypt + DB sessions)
 *
 * POST   /api/admin/auth — Login (checks admin_users table with bcrypt)
 * DELETE /api/admin/auth — Logout (clears session)
 * GET    /api/admin/auth — Check session status
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  verifyPassword,
  createSession,
  verifySession,
  deleteSession,
  getAdminByEmail,
  rateLimit,
} from '@/lib/auth'

const COOKIE_NAME = 'admin_session'

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!rateLimit(`admin-login:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again in a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Check plain-text env var first (fastest, no DB round-trip)
    const envEmail = process.env.ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAIL
    const envPassword = process.env.ADMIN_PASSWORD
    if (envEmail && envPassword && email.trim() === envEmail.trim() && password === envPassword.trim()) {
      const token = await createSession({ id: 'env-admin', email: email.trim(), name: 'Admin', role: 'super_admin' })
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const cookieStore = await cookies()
      cookieStore.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', expires: expiresAt, path: '/' })
      return NextResponse.json({ success: true, user: { email: email.trim(), name: 'Admin', role: 'super_admin' }, expiresAt: expiresAt.toISOString() })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Admin auth: SUPABASE_SERVICE_ROLE_KEY not configured')
    }

    // Look up user in admin_users table
    const user = await getAdminByEmail(email)

    if (!user) {
      if (!envPassword) {
        console.error(
          `Admin auth: no match for ${email.trim()} — set ADMIN_EMAIL/ADMIN_PASSWORD on Vercel or run scripts/create-admin-user.ts`
        )
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password with bcrypt
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create DB-backed session
    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Set httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    // Update last_login_at
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      user: { email: user.email, name: user.name, role: user.role },
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: unknown) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (token) {
      await deleteSession(token)
    }

    cookieStore.delete(COOKIE_NAME)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const user = await verifySession(token)
    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      user: { email: user.email, name: user.name, role: user.role },
    })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
