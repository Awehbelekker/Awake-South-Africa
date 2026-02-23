'use client'

/**
 * Bulk Image Upload Component
 * 
 * Upload multiple images directly to Supabase Storage
 * Optionally create product records automatically
 */

import { useState, useRef } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { Upload, X, Image as ImageIcon, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useSupabaseUpload } from '@/hooks/useSupabaseUpload'

interface UploadedFile {
  file: File
  preview: string
  url?: string
  error?: string
  uploading?: boolean
  success?: boolean
}

export function BulkImageUpload() {
  const { tenant } = useTenant()
  const { uploadImage } = useSupabaseUpload()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [createProducts, setCreateProducts] = useState(true)
  const [category, setCategory] = useState('uncategorized')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(selectedFiles: FileList | null) {
    if (!selectedFiles || selectedFiles.length === 0) return

    const maxSize = 100 * 1024 * 1024 // 100MB
    const newFiles: UploadedFile[] = []
    const tooLarge: string[] = []

    Array.from(selectedFiles).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (file.size > maxSize) {
          tooLarge.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        } else {
          newFiles.push({
            file,
            preview: URL.createObjectURL(file),
          })
        }
      }
    })

    if (tooLarge.length > 0) {
      setError(`${tooLarge.length} file(s) too large (max 100MB): ${tooLarge.join(', ')}`)
    }

    setFiles((prev) => [...prev, ...newFiles])
    if (newFiles.length > 0) {
      setSuccess(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  async function handleUpload() {
    if (files.length === 0) return
    if (!tenant?.id) {
      setError('Tenant not found')
      return
    }

    if (!confirm(
      `Upload ${files.length} image(s) to Supabase Storage?${
        createProducts ? '\n\nThis will also create product records.' : ''
      }`
    )) {
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    const results: Array<{ url: string; name: string; productId?: string }> = []
    const errors: Array<{ name: string; error: string }> = []

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i]

      try {
        // Update file status
        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[i].uploading = true
          return newFiles
        })

        // Upload to Supabase
        const url = await uploadImage(uploadFile.file, `${tenant.id}/products`)

        if (!url) {
          throw new Error('Upload failed - no URL returned')
        }

        // Update file with URL
        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[i].url = url
          newFiles[i].uploading = false
          newFiles[i].success = true
          return newFiles
        })

        results.push({ url, name: uploadFile.file.name })

        // Create product if requested
        if (createProducts) {
          const supabase = (await import('@supabase/supabase-js')).createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )

          const slug = uploadFile.file.name
            .replace(/\.[^/.]+$/, '') // Remove extension
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')

          const productData = {
            tenant_id: tenant.id,
            slug,
            name: uploadFile.file.name.replace(/\.[^/.]+$/, ''),
            description: `Uploaded: ${uploadFile.file.name}`,
            price: 0,
            category,
            images: [url],
            image: url,
            in_stock: false,
            stock_quantity: 0,
            is_featured: false,
            metadata: {
              uploaded_at: new Date().toISOString(),
              storage_location: 'supabase',
            },
          }

          const { data: product, error: productError } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single()

          if (productError) {
            errors.push({
              name: uploadFile.file.name,
              error: `Image uploaded but product creation failed: ${productError.message}`,
            })
          } else {
            results[results.length - 1].productId = product.id
          }
        }
      } catch (err: any) {
        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[i].uploading = false
          newFiles[i].error = err.message
          return newFiles
        })
        errors.push({
          name: uploadFile.file.name,
          error: err.message,
        })
      }
    }

    setUploading(false)

    if (errors.length === 0) {
      setSuccess(`✅ Successfully uploaded ${results.length} image(s)${createProducts ? ' and created products' : ''}!`)
      setTimeout(() => {
        setFiles([])
        setSuccess(null)
      }, 3000)
    } else {
      setError(`${errors.length} file(s) failed. See details below.`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Options */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={createProducts}
              onChange={(e) => setCreateProducts(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Create product records</span>
          </label>
          
          {createProducts && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="uncategorized">Uncategorized</option>
                <option value="electric-bikes">Electric Bikes</option>
                <option value="accessories">Accessories</option>
                <option value="parts">Parts</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 mb-1">
          <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm text-gray-500">PNG, JPG, GIF, WEBP (max 100MB per file)</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-start">
          <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {files.length} file{files.length !== 1 ? 's' : ''} ready
            </h3>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload All</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className={`relative group border-2 rounded-lg overflow-hidden ${
                  file.success
                    ? 'border-green-500'
                    : file.error
                    ? 'border-red-500'
                    : file.uploading
                    ? 'border-blue-500'
                    : 'border-gray-200'
                }`}
              >
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-full h-32 object-cover"
                />
                
                {/* Status Overlay */}
                {(file.uploading || file.success || file.error) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    {file.uploading && <Loader2 className="w-8 h-8 text-white animate-spin" />}
                    {file.success && <Check className="w-8 h-8 text-green-400" />}
                    {file.error && <AlertCircle className="w-8 h-8 text-red-400" />}
                  </div>
                )}

                {/* Remove Button */}
                {!file.uploading && !file.success && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-600 truncate">{file.file.name}</p>
                  <p className="text-xs text-gray-400">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
