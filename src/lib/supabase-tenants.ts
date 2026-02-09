import { supabase } from './supabase'
import type { Tenant, TenantInsert, TenantUpdate } from '@/types/supabase'

/**
 * Get all tenants (for master admin)
 */
export async function getAllTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch tenants: ${error.message}`)
  return data as Tenant[]
}

/**
 * Get a single tenant by ID
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(`Failed to fetch tenant: ${error.message}`)
  }
  return data as Tenant
}

/**
 * Get a tenant by slug (for subdomain detection)
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(`Failed to fetch tenant: ${error.message}`)
  }
  return data as Tenant
}

/**
 * Get a tenant by custom domain
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('domain', domain)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(`Failed to fetch tenant: ${error.message}`)
  }
  return data as Tenant
}

/**
 * Create a new tenant (master admin only)
 */
export async function createTenant(tenant: TenantInsert): Promise<Tenant> {
  const { data, error } = await supabase
    .from('tenants')
    .insert(tenant)
    .select()
    .single()

  if (error) throw new Error(`Failed to create tenant: ${error.message}`)
  return data as Tenant
}

/**
 * Update a tenant (master admin only)
 */
export async function updateTenant(id: string, updates: TenantUpdate): Promise<Tenant> {
  const { data, error } = await supabase
    .from('tenants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update tenant: ${error.message}`)
  return data as Tenant
}

/**
 * Deactivate a tenant (soft delete)
 */
export async function deactivateTenant(id: string): Promise<void> {
  const { error } = await supabase
    .from('tenants')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Failed to deactivate tenant: ${error.message}`)
}

/**
 * Get tenant PayFast credentials (for payment processing)
 */
export async function getTenantPayFastCredentials(tenantId: string): Promise<{
  merchantId: string | null
  merchantKey: string | null
  passphrase: string | null
} | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('payfast_merchant_id, payfast_merchant_key, payfast_passphrase')
    .eq('id', tenantId)
    .single()

  if (error) return null
  return {
    merchantId: data.payfast_merchant_id,
    merchantKey: data.payfast_merchant_key,
    passphrase: data.payfast_passphrase,
  }
}

/**
 * Validate that a slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  return !data
}

