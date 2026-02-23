'use client'

/**
 * Direct Image Upload Component
 * 
 * Upload product images directly to Supabase Storage
 * Alternative to Google Drive sync
 */

import { useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { useSupabaseUpload } from '@/hooks/useSupabaseUpload'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  onImagesUploaded?: (urls: string[]) => void
  maxFiles?: number
  folder?: string
}

export function ImageUpload({
  onImagesUploaded,
  maxFiles = 10,
  folder = 'products',
}: ImageUploadProps) {
  const { tenant } = useTenant()
  const { uploadMultiple, uploading, progress } = useSupabaseUpload()
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const invalidFiles = files.filter(f => !validTypes.includes(f.type))

    if (invalidFiles.length > 0) {
      setError('Only JPG, PNG, WEBP, and GIF files are allowed')
      return
    }

    // Validate file sizes (max 10MB per file)
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError('Files must be smaller than 10MB')
      return
    }

    setError(null)

    // Show previews
    const previewUrls = files.map(file => URL.createObjectURL(file))
    setPreviews(previewUrls)

    if (!tenant?.id) {
      setError('No tenant context available')
      return
    }

    // Upload to Supabase Storage
    try {
      const results = await uploadMultiple(files, {
        tenantId: tenant.id,
        bucket: 'product-images',
        folder,
      })

      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        setError(`${errors.length} file(s) failed to upload`)
      }

      const successUrls = results.filter(r => r.url).map(r => r.url!)

      if (onImagesUploaded && successUrls.length > 0) {
        onImagesUploaded(successUrls)
      }

      // Clear previews after successful upload
      if (errors.length === 0) {
        setTimeout(() => {
          previewUrls.forEach(url => URL.revokeObjectURL(url))
          setPreviews([])
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    }
  }

  const removePreview = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-gray-600">Uploading... {Math.round(progress)}%</p>
              <div className="w-full max-w-xs mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WEBP, GIF up to 10MB (max {maxFiles} files)
              </p>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 text-gray-900 bg-white"
              />
              <button
                onClick={() => removePreview(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium">Where are images stored?</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Uploaded to Supabase Storage (secure & fast)</li>
          <li>Organized by your tenant ID (isolated from other stores)</li>
          <li>Accessible via CDN for fast loading</li>
          <li>URLs automatically saved to product records</li>
        </ul>
      </div>
    </div>
  )
}
