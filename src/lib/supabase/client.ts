/**
 * Supabase Client
 * Re-exports from the index module
 */
export { supabase, isSupabaseConfigured, handleSupabaseError } from './index'
import { createClient as _createClient } from '@supabase/supabase-js'

/**
 * Pre-configured createClient that uses env vars automatically.
 * Can be called with no arguments (uses defaults) or with explicit url/key.
 */
export function createClient(url?: string, key?: string) {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return _createClient(supabaseUrl, supabaseKey)
}
