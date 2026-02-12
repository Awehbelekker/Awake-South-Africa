/**
 * Master Admin - Tenant Storage Configuration API
 * 
 * GET /api/master-admin/tenants/[id]/storage - Get storage config
 * PUT /api/master-admin/tenants/[id]/storage - Update storage config
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  const masterKey = process.env.MASTER_ADMIN_API_KEY
  if (!masterKey) return false
  return authHeader === `Bearer ${masterKey}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select(`
        google_drive_client_id,
        google_drive_folder_id,
        google_drive_enabled,
        onedrive_client_id,
        onedrive_folder_id,
        onedrive_enabled
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Return storage status (don't expose secrets)
    return NextResponse.json({
      googleDrive: {
        configured: !!tenant.google_drive_client_id,
        enabled: tenant.google_drive_enabled,
        folderId: tenant.google_drive_folder_id,
      },
      oneDrive: {
        configured: !!tenant.onedrive_client_id,
        enabled: tenant.onedrive_enabled,
        folderId: tenant.onedrive_folder_id,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const updateData: Record<string, any> = {}

    // Google Drive config
    if (body.googleDrive) {
      if (body.googleDrive.clientId !== undefined) {
        updateData.google_drive_client_id = body.googleDrive.clientId
      }
      if (body.googleDrive.clientSecret !== undefined) {
        updateData.google_drive_client_secret = body.googleDrive.clientSecret
      }
      if (body.googleDrive.refreshToken !== undefined) {
        updateData.google_drive_refresh_token = body.googleDrive.refreshToken
      }
      if (body.googleDrive.folderId !== undefined) {
        updateData.google_drive_folder_id = body.googleDrive.folderId
      }
      if (body.googleDrive.enabled !== undefined) {
        updateData.google_drive_enabled = body.googleDrive.enabled
      }
    }

    // OneDrive config
    if (body.oneDrive) {
      if (body.oneDrive.clientId !== undefined) {
        updateData.onedrive_client_id = body.oneDrive.clientId
      }
      if (body.oneDrive.clientSecret !== undefined) {
        updateData.onedrive_client_secret = body.oneDrive.clientSecret
      }
      if (body.oneDrive.refreshToken !== undefined) {
        updateData.onedrive_refresh_token = body.oneDrive.refreshToken
      }
      if (body.oneDrive.folderId !== undefined) {
        updateData.onedrive_folder_id = body.oneDrive.folderId
      }
      if (body.oneDrive.enabled !== undefined) {
        updateData.onedrive_enabled = body.oneDrive.enabled
      }
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select('id, name')
      .single()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Storage configuration updated'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

