export const dynamic = 'force-dynamic'

/**
 * Google Drive File Browser API
 * 
 * Browse tenant's Drive folders and transfer selected images to Supabase Storage
 * GET - List files/folders in Drive with navigation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  const data = await response.json()
  return data.access_token
}

async function listDriveFiles(accessToken: string, folderId: string = 'root') {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,size,thumbnailLink,webViewLink,iconLink,createdTime,modifiedTime)',
    pageSize: '100',
    orderBy: 'folder,name',
  })

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to list Drive files')
  }

  return await response.json()
}

async function getFolderPath(accessToken: string, folderId: string): Promise<Array<{ id: string; name: string }>> {
  if (folderId === 'root') return [{ id: 'root', name: 'My Drive' }]

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,parents`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) return [{ id: 'root', name: 'My Drive' }]

  const file = await response.json()
  const path = [{ id: file.id, name: file.name }]

  if (file.parents && file.parents[0] !== 'root') {
    const parentPath = await getFolderPath(accessToken, file.parents[0])
    return [...parentPath, ...path]
  }

  return [{ id: 'root', name: 'My Drive' }, ...path]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const folderId = searchParams.get('folder_id') || 'root'

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant_id parameter' },
        { status: 400 }
      )
    }

    // Get tenant's Drive credentials
    const supabase = getSupabase()
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('google_drive_enabled, google_refresh_token, name')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    if (!tenant.google_drive_enabled || !tenant.google_refresh_token) {
      return NextResponse.json(
        { error: 'Google Drive not connected for this tenant' },
        { status: 400 }
      )
    }

    // Get access token
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!
    const accessToken = await refreshAccessToken(
      clientId,
      clientSecret,
      tenant.google_refresh_token
    )

    // List files in folder
    const filesData = await listDriveFiles(accessToken, folderId)

    // Get folder breadcrumb path
    const folderPath = await getFolderPath(accessToken, folderId)

    // Separate folders and files
    const folders = filesData.files.filter((f: any) => 
      f.mimeType === 'application/vnd.google-apps.folder'
    )
    const files = filesData.files.filter((f: any) => 
      f.mimeType !== 'application/vnd.google-apps.folder'
    )

    // Filter for image files
    const imageFiles = files.filter((f: any) => 
      f.mimeType?.startsWith('image/')
    )

    return NextResponse.json({
      success: true,
      currentFolder: folderId,
      folderPath,
      folders,
      files: imageFiles,
      totalFiles: files.length,
      totalImages: imageFiles.length,
    })

  } catch (error: any) {
    console.error('Drive browse error:', error)
    return NextResponse.json(
      { error: 'Failed to browse Drive', details: error.message },
      { status: 500 }
    )
  }
}
