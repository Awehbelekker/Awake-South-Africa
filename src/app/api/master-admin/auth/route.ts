export const dynamic = 'force-dynamic'

/**
 * Master Admin Authentication API
 *
 * POST /api/master-admin/auth - Login (bcrypt + DB session)
 * DELETE /api/master-admin/auth - Logout
 * GET  /api/master-admin/auth - Check session
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  verifyPassword,
  generateSessionToken,
  createSession,
  verifySession,
  deleteSession,
  rateLimit,
} from '@/lib/auth'

const COOKIE_NAME = 'master_admin_auth'

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!rateLimit(`master-login:${ip}`, 5, 60_000)) {
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

    // Check against environment variables
    const masterEmail = process.env.MASTER_ADMIN_EMAIL
    const masterPasswordHash = process.env.MASTER_ADMIN_PASSWORD_HASH
    const masterPasswordPlain = process.env.MASTER_ADMIN_PASSWORD

    if (!masterEmail || (!masterPasswordHash && !masterPasswordPlain)) {
      console.error('Master admin credentials not configured')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    if (email.trim() !== masterEmail.trim()) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Support both plain password (env: MASTER_ADMIN_PASSWORD) and bcrypt hash
    let valid = false
    if (masterPasswordPlain) {
      valid = password === masterPasswordPlain.trim()
    } else if (masterPasswordHash) {
      valid = await verifyPassword(password, masterPasswordHash.trim())
    }
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create DB-backed session
    const token = await createSession({
      id: 'master-admin',
      email: masterEmail,
      name: 'Master Admin',
      role: 'super_admin',
    })

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: unknown) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (token) await deleteSession(token)
    cookieStore.delete(COOKIE_NAME)

    return NextResponse.json({ success: true, message: 'Logged out' })
  } catch {
    return NextResponse.json({ success: true })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return NextResponse.json({ authenticated: false })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ authenticated: false })

    return NextResponse.json({
      authenticated: true,
      email: user.email,
      role: user.role,
    })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}

