'use client'

/**
 * Admin Product Import Page
 * 
 * Dedicated page for importing products from Google Drive
 * Shows connection status and import interface
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { GoogleDriveConnection } from '@/components/admin/GoogleDriveConnection'
import { GoogleDriveBrowser } from '@/components/admin/GoogleDriveBrowser'
import { ImageUpload } from '@/components/admin/ImageUpload'

export default function AdminImportPage() {
  const router = useRouter()
  const { isAuthenticated } = useAdminStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  return (
    <AdminLayout title="Import Products">
      <div className="max-w-4xl space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Google Drive Integration
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your Google Drive to automatically import product images.
            Images in your Drive folder will be created as product records that you can edit.
          </p>

          <GoogleDriveConnection />
        </div>

        {/* Option 1: Browse Google Drive & Transfer to Supabase */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📁 Browse Google Drive
          </h2>
          <p className="text-gray-600 mb-6">
            Navigate your Google Drive folders, select images, and transfer them to Supabase Storage.
            Images will be permanently stored on Supabase (not just linked).
          </p>
          <GoogleDriveBrowser />
        </div>

        {/* Option 2: Direct Upload to Supabase */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📤 Direct Upload
          </h2>
          <p className="text-gray-600 mb-6">
            Drag and drop images directly from your computer to Supabase Storage.
          </p>
          <ImageUpload
            onImagesUploaded={(urls) => {
              console.log('Uploaded URLs:', urls)
              alert(`${urls.length} image(s) uploaded successfully! URLs saved: ${urls.join(', ')}`)
            }}
            maxFiles={10}
            folder="products"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 How It Works</h3>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li><strong>Google Drive Browser:</strong> Select images from your Drive → Transfer to Supabase → Images saved permanently</li>
            <li><strong>Direct Upload:</strong> Drag & drop from your computer → Upload to Supabase → Instant availability</li>
            <li><strong>Both options:</strong> Images stored in Supabase Storage buckets (isolated per tenant)</li>
            <li><strong>Access anywhere:</strong> Login from any device - images stored in cloud, not locally</li>
            <li><strong>After import:</strong> Edit product details in Products page, set prices, mark "In Stock"</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
