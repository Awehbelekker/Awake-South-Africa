'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAdminStore } from '@/store/admin'
import { createClient } from '@supabase/supabase-js'
import type { Page } from '@/lib/types/pages'

const PageBuilder = dynamic(() => import('@/components/admin/PageBuilder'), { ssr: false })

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function NewPageBuilderPage() {
  const router = useRouter()
  const { isAuthenticated } = useAdminStore()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#1B2A6B')

  useEffect(() => {
    if (!isAuthenticated) { router.push('/admin'); return }
    const supabase = getSupabase()
    supabase.from('tenants').select('id, primary_color').limit(1).single()
      .then(({ data }) => {
        if (data) { setTenantId(data.id); if (data.primary_color) setPrimaryColor(data.primary_color) }
      })
  }, [isAuthenticated, router])

  if (!tenantId) return null

  return <PageBuilder tenantId={tenantId} primaryColor={primaryColor} />
}
