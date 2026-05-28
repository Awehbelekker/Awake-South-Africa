export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const urlPreview = url ? `${url.slice(0, 30)}… (len=${url.length})` : 'MISSING'
  const keyPreview = key ? `${key.slice(0, 15)}… (len=${key.length})` : 'MISSING'

  if (!url || !key) {
    return NextResponse.json({ error: 'env vars missing', url: urlPreview, key: keyPreview })
  }

  try {
    const supabase = createClient(url, key)
    const { data, error } = await supabase.from('tenants').select('id,name,slug,domain,is_active').limit(5)
    return NextResponse.json({
      url: urlPreview,
      key: keyPreview,
      supabaseError: error ? { message: error.message, code: error.code } : null,
      tenants: data || [],
    })
  } catch (e: any) {
    return NextResponse.json({ url: urlPreview, key: keyPreview, exception: e.message })
  }
}
