'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { createClient } from '@supabase/supabase-js'
import { Plus, ExternalLink, Pencil, Globe, FileText } from 'lucide-react'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

interface PageRow {
  id: string
  title: string
  slug: string
  published: boolean
  updated_at: string
}

export default function AdminPagesPage() {
  const router = useRouter()
  const { isAuthenticated } = useAdminStore()
  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/admin'); return }
  }, [isAuthenticated, router])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabase()
      const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
      if (!tenant) { setLoading(false); return }
      setTenantId(tenant.id)
      const { data } = await supabase.from('pages').select('id, title, slug, published, updated_at')
        .eq('tenant_id', tenant.id).order('updated_at', { ascending: false })
      setPages(data || [])
      setLoading(false)
    }
    if (isAuthenticated) fetchData()
  }, [isAuthenticated])

  return (
    <AdminLayout title="Pages">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Website Pages</h2>
            <p className="text-sm text-gray-500 mt-1">Build and manage your store's pages with the visual editor</p>
          </div>
          <Link href="/admin/pages/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> New Page
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading pages...</div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-600 font-medium">No pages yet</h3>
            <p className="text-gray-400 text-sm mb-4">Create your first page with the visual editor</p>
            <Link href="/admin/pages/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Create first page
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{page.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">/{page.slug === 'home' ? '' : page.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${page.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {page.published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/pages/${page.id}`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                          <Pencil className="w-3 h-3" /> Edit
                        </Link>
                        {page.published && (
                          <a href={`/${page.slug === 'home' ? '' : page.slug}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
