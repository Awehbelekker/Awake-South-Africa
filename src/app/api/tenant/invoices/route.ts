export const dynamic = 'force-dynamic'

/**
 * Tenant Invoices API
 *
 * GET    /api/tenant/invoices         - List all invoices for tenant
 * POST   /api/tenant/invoices         - Create invoice
 * PATCH  /api/tenant/invoices         - Update invoice (body must include id)
 * DELETE /api/tenant/invoices?id=xxx  - Delete invoice
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(): any {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getTenantId(request: NextRequest): Promise<string | null> {
  const tenantSlug = request.headers.get('x-tenant-slug')
  const customDomain = request.headers.get('x-custom-domain')
  const isCustomDomain = request.headers.get('x-is-custom-domain') === 'true'
  const explicitTenantId = new URL(request.url).searchParams.get('tenant_id')

  if (explicitTenantId) return explicitTenantId

  let tenant = null

  if (isCustomDomain && customDomain) {
    const { data } = await getSupabase()
      .from('tenants')
      .select('id')
      .eq('domain', customDomain)
      .eq('is_active', true)
      .single()
    tenant = data
  } else if (tenantSlug) {
    const { data } = await getSupabase()
      .from('tenants')
      .select('id')
      .or(`subdomain.eq.${tenantSlug},slug.eq.${tenantSlug}`)
      .eq('is_active', true)
      .single()
    tenant = data
  }

  if (!tenant) {
    const { data } = await getSupabase()
      .from('tenants')
      .select('id')
      .eq('slug', 'awake-sa')
      .single()
    tenant = data
  }

  return tenant?.id || null
}

// GET /api/tenant/invoices
export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const tenantId = await getTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '200')

    let query = getSupabase()
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      // Table may not exist yet — return empty gracefully
      if (error.code === '42P01') {
        return NextResponse.json({ invoices: [], total: 0, tableExists: false })
      }
      console.error('Invoices GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const invoices = (data || []).map((row: any) => ({
      id: row.local_id || row.id,
      _supabaseId: row.id,
      invoiceNumber: row.invoice_number,
      type: row.type || 'custom',
      referenceId: row.reference_id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      customerAddress: row.customer_address,
      items: row.items || [],
      subtotal: row.subtotal,
      taxRate: row.tax_rate,
      taxAmount: row.tax_amount,
      total: row.total,
      status: row.status,
      dueDate: row.due_date,
      paidDate: row.paid_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    // ── Auto-flag overdue invoices ──────────────────────────────────────────
    // Any invoice with status='sent' whose due_date has passed becomes 'overdue'
    const now = new Date().toISOString()
    const overdueIds = (data || [])
      .filter((row: any) => row.status === 'sent' && row.due_date && row.due_date < now)
      .map((row: any) => row.id)

    if (overdueIds.length > 0) {
      await getSupabase()
        .from('invoices')
        .update({ status: 'overdue', updated_at: now })
        .in('id', overdueIds)

      // Patch the mapped list in memory so response is consistent
      invoices.forEach((inv: any) => {
        if (inv._supabaseId && overdueIds.includes(inv._supabaseId)) {
          inv.status = 'overdue'
        }
      })
    }

    return NextResponse.json({ invoices, total: invoices.length })
  } catch (error: any) {
    console.error('Invoices GET error:', error?.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/tenant/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const tenantId = await getTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const body = await request.json()
    const inv = body

    const { data, error } = await getSupabase()
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        local_id: inv.id,
        invoice_number: inv.invoiceNumber,
        type: inv.type || 'custom',
        reference_id: inv.referenceId || null,
        customer_name: inv.customerName,
        customer_email: inv.customerEmail,
        customer_phone: inv.customerPhone || null,
        customer_address: inv.customerAddress || null,
        items: inv.items,
        subtotal: inv.subtotal,
        tax_rate: inv.taxRate,
        tax_amount: inv.taxAmount,
        total: inv.total,
        status: inv.status || 'draft',
        due_date: inv.dueDate,
        paid_date: inv.paidDate || null,
        notes: inv.notes || null,
        created_at: inv.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') {
        // Table missing — return success anyway (frontend has localStorage fallback)
        return NextResponse.json({ success: true, fallback: true })
      }
      console.error('Invoice create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoice: data })
  } catch (error: any) {
    console.error('Invoices POST error:', error?.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/tenant/invoices - Update invoice
export async function PATCH(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const body = await request.json()
    const { id, _supabaseId, ...updates } = body

    // Prefer Supabase UUID if available, fallback to matching by local_id
    const supabaseId = _supabaseId || id

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    }
    if (updates.status !== undefined) updatePayload.status = updates.status
    if (updates.paidDate !== undefined) updatePayload.paid_date = updates.paidDate
    if (updates.notes !== undefined) updatePayload.notes = updates.notes
    if (updates.items !== undefined) updatePayload.items = updates.items
    if (updates.customerName !== undefined) updatePayload.customer_name = updates.customerName
    if (updates.customerEmail !== undefined) updatePayload.customer_email = updates.customerEmail
    if (updates.subtotal !== undefined) updatePayload.subtotal = updates.subtotal
    if (updates.taxAmount !== undefined) updatePayload.tax_amount = updates.taxAmount
    if (updates.total !== undefined) updatePayload.total = updates.total
    if (updates.dueDate !== undefined) updatePayload.due_date = updates.dueDate

    // Try update by Supabase UUID first, then by local_id
    let result = await getSupabase()
      .from('invoices')
      .update(updatePayload)
      .eq('id', supabaseId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (result.error && result.error.code !== '42P01') {
      // Try by local_id
      result = await getSupabase()
        .from('invoices')
        .update(updatePayload)
        .eq('local_id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single()
    }

    if (result.error) {
      if (result.error.code === '42P01') {
        return NextResponse.json({ success: true, fallback: true })
      }
      console.error('Invoice update error:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoice: result.data })
  } catch (error: any) {
    console.error('Invoices PATCH error:', error?.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/tenant/invoices?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'No invoice id provided' }, { status: 400 })

    // Try by Supabase UUID first
    const result = await getSupabase()
      .from('invoices')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id')

    if (result.error?.code === '42P01') {
      return NextResponse.json({ success: true, fallback: true })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Invoices DELETE error:', error?.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
