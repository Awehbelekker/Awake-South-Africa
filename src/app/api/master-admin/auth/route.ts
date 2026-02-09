/**
 * Master Admin Authentication API
 * 
 * POST /api/master-admin/auth - Login
 * DELETE /api/master-admin/auth - Logout
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

// Simple password verification (in production, use bcrypt)
function verifyPassword(password: string, hash: string): boolean {
  const inputHash = createHash('sha256').update(password).digest('hex')
  return inputHash === hash
}

// Generate session token
function generateSessionToken(): string {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Check against environment variables
    const masterEmail = process.env.MASTER_ADMIN_EMAIL
    const masterPasswordHash = process.env.MASTER_ADMIN_PASSWORD_HASH

    if (!masterEmail || !masterPasswordHash) {
      console.error('Master admin credentials not configured')
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Verify credentials
    if (email !== masterEmail) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!verifyPassword(password, masterPasswordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('master_admin_auth', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    // Store session (in production, use Redis or database)
    // For now, we'll verify by checking if cookie exists
    cookieStore.set('master_admin_email', email, {
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

  } catch (error: any) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    
    // Clear auth cookies
    cookieStore.delete('master_admin_auth')
    cookieStore.delete('master_admin_email')

    return NextResponse.json({ success: true, message: 'Logged out' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Check auth status
export async function GET() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('master_admin_auth')
    const emailCookie = cookieStore.get('master_admin_email')

    if (!authCookie || !emailCookie) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ 
      authenticated: true,
      email: emailCookie.value,
    })
  } catch (error: any) {
    return NextResponse.json({ authenticated: false })
  }
}

