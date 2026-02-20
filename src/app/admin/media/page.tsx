'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { MediaLibrary } from '@/components/admin/MediaLibrary'

export default function AdminMediaPage() {
  const router = useRouter()
  const { isAuthenticated } = useAdminStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Library</h1>
          <p className="text-gray-600">
            Centralized media storage. Upload images once, reuse everywhere.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload images here to your central media library</li>
            <li>• These images are stored in Supabase Storage ({'{tenant-id}/media-library/'})</li>
            <li>• Reuse images across multiple products without re-uploading</li>
            <li>• Delete unused media to save storage space</li>
          </ul>
        </div>

        <MediaLibrary />
      </div>
    </AdminLayout>
  )
}

