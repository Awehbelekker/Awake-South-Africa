/**
 * Supabase Client
 * Re-exports from the index module
 */
export { supabase, isSupabaseConfigured, handleSupabaseError } from './index'
import { createClient as _createClient } from '@supabase/supabase-js'

/**
 * Pre-configured createClient that uses env vars automatically.
 * Can be called with no arguments (uses defaults) or with explicit url/key.
 * Returns a no-op proxy if env vars are missing (e.g., during build).
 */
export function createClient(url?: string, key?: string) {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !supabaseKey) {
    // During build, env vars may not be available — return safe no-op
    return new Proxy({} as any, {
      get: () => () => ({ data: null, error: { message: 'Supabase not configured' } }),
    })
  }
  return _createClient(supabaseUrl, supabaseKey)
}
