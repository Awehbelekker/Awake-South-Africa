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
import { BulkImageUpload } from '@/components/admin/BulkImageUpload'
import ImageScraper from '@/components/admin/ImageScraper'

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
            Browse Google Drive
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
            📤 Bulk Upload from Computer
          </h2>
          <p className="text-gray-600 mb-6">
            Drag and drop multiple images directly from your computer. 
            Optionally create product records automatically.
          </p>
          <BulkImageUpload />
        </div>

        {/* Option 3: Scrape from awakeboards.com */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🌐 Scrape from awakeboards.com
          </h2>
          <p className="text-gray-600 mb-6">
            Automatically scrape product images from the official Awake website.
            Downloads images and uploads to Supabase Storage, then links them to your products.
          </p>
          <ImageScraper />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How It Works</h3>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li><strong>Google Drive Browser:</strong> Select images from your Drive &rarr; Transfer to Supabase &rarr; Images saved permanently</li>
            <li><strong>Direct Upload:</strong> Drag &amp; drop from your computer &rarr; Upload to Supabase &rarr; Instant availability</li>
            <li><strong>Both options:</strong> Images stored in Supabase Storage buckets (isolated per tenant)</li>
            <li><strong>Access anywhere:</strong> Login from any device - images stored in cloud, not locally</li>
            <li><strong>After import:</strong> Edit product details in Products page, set prices, mark &ldquo;In Stock&rdquo;</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
