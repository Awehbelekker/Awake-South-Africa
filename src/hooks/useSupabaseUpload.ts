/**
 * Supabase Storage Upload Hook
 * 
 * Upload images directly to Supabase Storage buckets
 * Automatically organized by tenant ID
 */

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UploadOptions {
  tenantId: string
  bucket?: 'product-images' | 'store-assets'
  folder?: string
}

interface UploadResult {
  url: string | null
  path: string | null
  error: string | null
}

export function useSupabaseUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  async function uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    setUploading(true)
    setProgress(0)

    try {
      const { tenantId, bucket = 'product-images', folder = '' } = options

      // Generate unique filename
      const timestamp = Date.now()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase()
      const fileName = `${timestamp}-${cleanName}`

      // Folder structure: {tenant-id}/{optional-folder}/{filename}
      const filePath = folder
        ? `${tenantId}/${folder}/${fileName}`
        : `${tenantId}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setProgress(100)

      return {
        url: urlData.publicUrl,
        path: filePath,
        error: null,
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      return {
        url: null,
        path: null,
        error: error.message,
      }
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  async function uploadMultiple(
    files: File[],
    options: UploadOptions
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const result = await uploadFile(files[i], options)
      results.push(result)
      setProgress((i + 1) / files.length * 100)
    }

    return results
  }

  async function deleteFile(
    path: string,
    bucket: 'product-images' | 'store-assets' = 'product-images'
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path])

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  return {
    uploadFile,
    uploadMultiple,
    deleteFile,
    uploading,
    progress,
  }
}
