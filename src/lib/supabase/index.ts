/**
 * Supabase Client Configuration
 * Canonical source for the Supabase client instance
 * Uses lazy initialization to avoid crashing during Next.js build
 * when environment variables aren't available.
 */
import { createClient } from '@supabase/supabase-js'

let _supabase: any = null

function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not configured. Using localStorage fallback.')
      // Return a no-op proxy to prevent crashes during build
      return new Proxy({} as any, {
        get: () => () => ({ data: null, error: { message: 'Supabase not configured' } }),
      })
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return _supabase
}

// Export as a getter so it's lazily initialized
export const supabase: any = new Proxy({} as any, {
  get: (_target, prop) => {
    const client = getSupabase()
    const value = client[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Helper to handle Supabase errors
export const handleSupabaseError = (error: unknown) => {
  console.error('Supabase error:', error)
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
  }
}
