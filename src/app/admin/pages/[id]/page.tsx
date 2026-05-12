'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/store/admin'
import { createClient } from '@supabase/supabase-js'
import PageBuilder from '@/components/admin/PageBuilder'
import type { Page } from '@/lib/types/pages'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function EditPageBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { isAuthenticated } = useAdminStore()
  const [page, setPage] = useState<Page | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#1B2A6B')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/admin'); return }
    const load = async () => {
      const { id } = await params
      const supabase = getSupabase()
      const [{ data: tenant }, { data: pageData }] = await Promise.all([
        supabase.from('tenants').select('id, primary_color').limit(1).single(),
        supabase.from('pages').select('*').eq('id', id).single(),
      ])
      if (tenant) { setTenantId(tenant.id); if (tenant.primary_color) setPrimaryColor(tenant.primary_color) }
      if (pageData) setPage(pageData as Page)
      setLoading(false)
    }
    load()
  }, [isAuthenticated, router, params])

  if (loading || !tenantId) return null

  return <PageBuilder page={page ?? undefined} tenantId={tenantId} primaryColor={primaryColor} />
}
