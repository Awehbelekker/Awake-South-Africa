/**
 * Tenant Onboarding Service
 * 
 * Simplifies adding new clients to the platform.
 * Master Admin just fills in the form - this handles the rest.
 * 
 * Flow:
 * 1. Enter client details (name, email, domain)
 * 2. Upload logo, pick colors
 * 3. Paste payment gateway credentials
 * 4. Connect their Google Drive (optional)
 * 5. Click "Create Store" - done!
 */

import { createClient } from '@supabase/supabase-js'
import { Database, PaymentGatewayCode, TenantInsert } from '@/types/supabase'
import { validateCredentials } from '@/lib/payments'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================
// TYPES FOR ONBOARDING
// ============================================

export interface NewTenantData {
  // Basic Info
  name: string
  slug: string // URL-friendly identifier (e.g., 'kelp-boards')
  email: string
  phone?: string
  
  // Domain
  subdomain?: string // kelp.yoursaas.com
  customDomain?: string // www.kelpboards.co.za
  
  // Branding
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  
  // Business Settings
  currency?: string
  taxRate?: number
  timezone?: string
  
  // Plan
  plan?: 'basic' | 'pro' | 'enterprise'
}

export interface PaymentGatewaySetup {
  gatewayCode: PaymentGatewayCode
  credentials: Record<string, string>
  isSandbox?: boolean
  isDefault?: boolean
}

export interface GoogleDriveSetup {
  clientId: string
  clientSecret: string
  refreshToken: string
  folderId?: string
}

export interface OnboardingResult {
  success: boolean
  tenantId?: string
  slug?: string
  error?: string
  warnings?: string[]
}

// ============================================
// MAIN ONBOARDING FUNCTIONS
// ============================================

/**
 * Create a new tenant with all their configuration
 */
export async function createTenant(
  data: NewTenantData,
  paymentGateways?: PaymentGatewaySetup[],
  googleDrive?: GoogleDriveSetup
): Promise<OnboardingResult> {
  const warnings: string[] = []

  try {
    // 1. Create the tenant record
    const tenantData: TenantInsert = {
      name: data.name,
      slug: data.slug,
      email: data.email,
      phone: data.phone,
      subdomain: data.subdomain || data.slug,
      domain: data.customDomain,
      logo_url: data.logoUrl,
      favicon_url: data.faviconUrl,
      primary_color: data.primaryColor || '#3B82F6',
      secondary_color: data.secondaryColor || '#1E40AF',
      accent_color: data.accentColor || '#F59E0B',
      currency: data.currency || 'ZAR',
      tax_rate: data.taxRate || 15,
      timezone: data.timezone || 'Africa/Johannesburg',
      plan: data.plan || 'basic',
      google_drive_client_id: googleDrive?.clientId,
      google_drive_client_secret: googleDrive?.clientSecret,
      google_drive_refresh_token: googleDrive?.refreshToken,
      google_drive_folder_id: googleDrive?.folderId,
      google_drive_enabled: !!googleDrive,
      is_active: true,
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert(tenantData)
      .select()
      .single()

    if (tenantError) {
      return { success: false, error: `Failed to create tenant: ${tenantError.message}` }
    }

    // 2. Add payment gateways
    if (paymentGateways && paymentGateways.length > 0) {
      for (const gateway of paymentGateways) {
        const result = await addPaymentGateway(tenant.id, gateway)
        if (!result.success) {
          warnings.push(`Payment gateway ${gateway.gatewayCode}: ${result.error}`)
        }
      }
    }

    return {
      success: true,
      tenantId: tenant.id,
      slug: tenant.slug,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    return { success: false, error: `Onboarding failed: ${error}` }
  }
}

/**
 * Add a payment gateway to an existing tenant
 */
export async function addPaymentGateway(
  tenantId: string,
  setup: PaymentGatewaySetup
): Promise<{ success: boolean; error?: string }> {
  // Validate credentials
  const validation = validateCredentials(setup.gatewayCode, setup.credentials)
  if (!validation.valid) {
    return { success: false, error: `Missing: ${validation.missingFields.join(', ')}` }
  }

  // Get gateway ID from code
  const { data: gateway } = await supabase
    .from('payment_gateways')
    .select('id')
    .eq('code', setup.gatewayCode)
    .single()

  if (!gateway) {
    return { success: false, error: `Gateway ${setup.gatewayCode} not found in system` }
  }

  // If this is default, unset other defaults
  if (setup.isDefault) {
    await supabase
      .from('tenant_payment_gateways')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
  }

  // Insert the gateway configuration
  const { error } = await supabase.from('tenant_payment_gateways').insert({
    tenant_id: tenantId,
    gateway_id: gateway.id,
    credentials: setup.credentials,
    is_sandbox: setup.isSandbox || false,
    is_default: setup.isDefault || false,
    is_enabled: true,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

