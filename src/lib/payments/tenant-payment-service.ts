/**
 * Tenant Payment Service
 * Fetches payment gateway credentials from database and creates gateway instances
 * 
 * This is the main entry point for payment processing in a multi-tenant environment.
 * The Master Admin configures credentials once, and this service handles the rest.
 */

import { createClient } from '@supabase/supabase-js'
import { PaymentGatewayCode, TenantPaymentGateway } from '@/types/supabase'
import { PaymentGateway, GatewayConfig, PaymentParams, PaymentResult } from './types'
import { createGateway } from './factory'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side operations
)

export interface TenantGatewayInfo {
  code: PaymentGatewayCode
  name: string
  isDefault: boolean
  isSandbox: boolean
  displayOrder: number
}

/**
 * Get all enabled payment gateways for a tenant
 * Used to display payment options at checkout
 */
export async function getTenantGateways(tenantId: string): Promise<TenantGatewayInfo[]> {
  const { data, error } = await supabase
    .from('tenant_payment_gateways')
    .select(`
      id,
      is_default,
      is_sandbox,
      display_order,
      payment_gateways!inner (
        code,
        name
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching tenant gateways:', error)
    return []
  }

  return (data || []).map((item: any) => ({
    code: item.payment_gateways.code as PaymentGatewayCode,
    name: item.payment_gateways.name,
    isDefault: item.is_default,
    isSandbox: item.is_sandbox,
    displayOrder: item.display_order,
  }))
}

/**
 * Get a specific payment gateway instance for a tenant
 * Creates the gateway with the tenant's stored credentials
 */
export async function getTenantGateway(
  tenantId: string,
  gatewayCode: PaymentGatewayCode
): Promise<PaymentGateway | null> {
  const { data, error } = await supabase
    .from('tenant_payment_gateways')
    .select(`
      credentials,
      is_sandbox,
      webhook_url,
      payment_gateways!inner (
        code
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('payment_gateways.code', gatewayCode)
    .eq('is_enabled', true)
    .single()

  if (error || !data) {
    console.error(`Gateway ${gatewayCode} not found for tenant ${tenantId}:`, error)
    return null
  }

  const config: GatewayConfig = {
    gatewayCode,
    credentials: data.credentials as Record<string, string>,
    isSandbox: data.is_sandbox,
    webhookUrl: data.webhook_url || '',
  }

  return createGateway(gatewayCode, config)
}

/**
 * Get the default payment gateway for a tenant
 */
export async function getDefaultTenantGateway(tenantId: string): Promise<PaymentGateway | null> {
  const { data, error } = await supabase
    .from('tenant_payment_gateways')
    .select(`
      credentials,
      is_sandbox,
      webhook_url,
      payment_gateways!inner (
        code
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true)
    .eq('is_default', true)
    .single()

  if (error || !data) {
    // Fallback: get first enabled gateway
    const gateways = await getTenantGateways(tenantId)
    if (gateways.length > 0) {
      return getTenantGateway(tenantId, gateways[0].code)
    }
    return null
  }

  const gatewayCode = (data as any).payment_gateways.code as PaymentGatewayCode

  const config: GatewayConfig = {
    gatewayCode,
    credentials: data.credentials as Record<string, string>,
    isSandbox: data.is_sandbox,
    webhookUrl: data.webhook_url || '',
  }

  return createGateway(gatewayCode, config)
}

/**
 * Process a payment for a tenant using their configured gateway
 * This is the simplest way to process a payment - just provide tenant ID and payment details
 */
export async function processPayment(
  tenantId: string,
  gatewayCode: PaymentGatewayCode | null,
  params: PaymentParams
): Promise<PaymentResult> {
  const gateway = gatewayCode
    ? await getTenantGateway(tenantId, gatewayCode)
    : await getDefaultTenantGateway(tenantId)

  if (!gateway) {
    return {
      success: false,
      gatewayCode: gatewayCode || 'payfast',
      paymentId: '',
      error: 'No payment gateway configured for this store',
    }
  }

  return gateway.createPayment(params)
}

/**
 * Verify a webhook from a payment gateway
 * Used to validate incoming payment notifications
 */
export async function verifyWebhook(
  tenantId: string,
  gatewayCode: PaymentGatewayCode,
  data: { body: any; signature: string; rawBody?: string }
): Promise<{ verified: boolean; status?: string; paymentId?: string; error?: string }> {
  const gateway = await getTenantGateway(tenantId, gatewayCode)

  if (!gateway) {
    return { verified: false, error: 'Gateway not configured' }
  }

  try {
    const result = await gateway.verifyWebhook({
      body: data.body,
      signature: data.signature,
      rawBody: data.rawBody || '',
    })

    return {
      verified: result.verified,
      status: result.status,
      paymentId: result.paymentId,
      error: result.error,
    }
  } catch (error: any) {
    return { verified: false, error: error.message }
  }
}

/**
 * Get available gateways for a tenant (for checkout display)
 */
export async function getAvailableGateways(tenantId: string): Promise<TenantGatewayInfo[]> {
  return getTenantGateways(tenantId)
}
