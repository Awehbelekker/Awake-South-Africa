/**
 * Server-side auth utilities: bcrypt, session management, RBAC, rate limiting.
 *
 * Sessions are stored in Supabase `admin_sessions` table.
 * Passwords are hashed with bcrypt (cost 12).
 */

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ── Supabase (service role for auth operations) ─────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Password hashing ────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ── Session management ──────────────────────────────────────────────────────
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
}

function sessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'awake-session-fallback-secret'
}

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex')
}

/**
 * Create a stateless HMAC-signed session token embedding user data.
 * Also attempts to persist in admin_sessions for revocation (best-effort).
 */
export async function createSession(user: SessionUser): Promise<string> {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  })
  const b64 = Buffer.from(payload).toString('base64url')
  const sig = signPayload(b64)
  const token = `${b64}.${sig}`

  // Best-effort DB persist for future revocation support
  try {
    await getSupabase().from('admin_sessions').insert({
      token,
      user_id: user.id,
      email: user.email,
      role: user.role,
      expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    })
  } catch {
    // Table may not exist — signed token is self-contained
  }

  return token
}

/**
 * Verify a session token. Validates HMAC signature and expiry from the token
 * itself — no DB round-trip required. DB lookup is used only when available
 * to support future revocation.
 */
export async function verifySession(token: string): Promise<SessionUser | null> {
  if (!token) return null

  // Stateless path: verify HMAC signature
  const parts = token.split('.')
  if (parts.length === 2) {
    const [b64, sig] = parts
    if (sig === signPayload(b64)) {
      try {
        const data = JSON.parse(Buffer.from(b64, 'base64url').toString())
        if (data.exp && Date.now() < data.exp) {
          return { id: data.id, email: data.email, name: data.name || '', role: data.role }
        }
      } catch {
        // malformed payload
      }
      return null
    }
  }

  // Legacy path: look up raw token in DB (for sessions created before this change)
  try {
    const { data, error } = await getSupabase()
      .from('admin_sessions')
      .select('user_id, email, role, expires_at')
      .eq('token', token)
      .single()

    if (error || !data) return null
    if (new Date(data.expires_at) < new Date()) {
      await getSupabase().from('admin_sessions').delete().eq('token', token)
      return null
    }

    return { id: data.user_id, email: data.email, name: '', role: data.role }
  } catch {
    return null
  }
}

/**
 * Delete a session (logout).
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    await getSupabase().from('admin_sessions').delete().eq('token', token)
  } catch {
    // Ignore — table may not exist
  }
}

// ── RBAC ────────────────────────────────────────────────────────────────────
export type AdminRole = 'super_admin' | 'admin' | 'editor'

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 3,
  admin: 2,
  editor: 1,
}

/**
 * Check if a user's role meets the minimum required role.
 */
export function hasRole(userRole: string, requiredRole: AdminRole): boolean {
  return (ROLE_HIERARCHY[userRole as AdminRole] ?? 0) >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Look up an admin user by email from the admin_users table.
 */
export async function getAdminByEmail(email: string) {
  const { data, error } = await getSupabase()
    .from('admin_users')
    .select('id, email, name, password_hash, role')
    .eq('email', email)
    .single()

  if (error || !data) return null
  return { ...data, name: (data.name as string) || '' }
}

// ── Rate limiting (in-memory, per-process) ──────────────────────────────────
interface RateBucket {
  count: number
  resetAt: number
}

const rateBuckets = new Map<string, RateBucket>()

/**
 * Simple sliding-window rate limiter.
 * @returns true if the request is allowed, false if rate-limited.
 */
export function rateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60_000
): boolean {
  const now = Date.now()
  const bucket = rateBuckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= maxRequests) {
    return false
  }

  bucket.count++
  return true
}

// Clean up stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now()
  rateBuckets.forEach((bucket, key) => {
    if (now > bucket.resetAt) rateBuckets.delete(key)
  })
}, 5 * 60_000)
