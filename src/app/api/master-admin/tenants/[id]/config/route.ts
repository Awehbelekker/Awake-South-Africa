/**
 * Master Admin API - Tenant Configuration
 * 
 * Allows Master Admin to configure OAuth, AI, and automation settings per tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Verify Master Admin authentication
function verifyMasterAdmin(request: NextRequest): { authorized: boolean; email?: string } {
  const authHeader = request.headers.get('authorization')
  const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL
  const masterAdminToken = process.env.MASTER_ADMIN_TOKEN

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false }
  }

  const token = authHeader.substring(7)
  
  // In production, verify JWT token
  // For now, simple token check
  if (token === masterAdminToken) {
    return { authorized: true, email: masterAdminEmail }
  }

  return { authorized: false }
}

/**
 * GET /api/master-admin/tenants/[id]/config
 * Get tenant configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyMasterAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, slug, oauth_config, ai_config, automation_config')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ tenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/master-admin/tenants/[id]/config
 * Update tenant configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyMasterAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { oauth_config, ai_config, automation_config } = body

    const updates: any = { updated_at: new Date().toISOString() }
    
    if (oauth_config) updates.oauth_config = oauth_config
    if (ai_config) updates.ai_config = ai_config
    if (automation_config) updates.automation_config = automation_config

    const { data: tenant, error } = await (supabase as any)
      .from('tenants')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await (supabase as any).from('master_admin_activity_log').insert({
      admin_email: auth.email,
      action: 'update_tenant_config',
      tenant_id: params.id,
      details: { updates: Object.keys(updates) },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ tenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

