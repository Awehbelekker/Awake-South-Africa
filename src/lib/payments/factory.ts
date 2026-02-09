/**
 * Payment Gateway Factory
 * Creates the appropriate payment gateway instance based on gateway code
 * 
 * Usage (in Master Admin):
 * 1. Select gateway type from dropdown
 * 2. Paste credentials (simple form)
 * 3. Save - factory handles the rest
 */

import { PaymentGatewayCode } from '@/types/supabase'
import { PaymentGateway, GatewayConfig } from './types'
import { PayFastGateway } from './payfast-gateway'
import { YocoGateway } from './yoco-gateway'
import { PeachPaymentsGateway } from './peach-gateway'
import { IKhokhaGateway } from './ikhokha-gateway'
import { StripeGateway } from './stripe-gateway'

/**
 * Gateway Registry - Maps gateway codes to their constructors
 */
const GATEWAY_REGISTRY: Record<PaymentGatewayCode, new (config: GatewayConfig) => PaymentGateway> = {
  payfast: PayFastGateway,
  yoco: YocoGateway,
  peach: PeachPaymentsGateway,
  ikhokha: IKhokhaGateway,
  stripe: StripeGateway,
}

/**
 * Gateway display information for Master Admin UI
 */
export const GATEWAY_INFO: Record<PaymentGatewayCode, {
  name: string
  description: string
  logo: string
  currencies: string[]
  requiredFields: { key: string; label: string; type: 'text' | 'password' }[]
}> = {
  payfast: {
    name: 'PayFast',
    description: 'South African cards, EFT, and mobile payments',
    logo: '/images/gateways/payfast.png',
    currencies: ['ZAR'],
    requiredFields: [
      { key: 'merchant_id', label: 'Merchant ID', type: 'text' },
      { key: 'merchant_key', label: 'Merchant Key', type: 'password' },
      { key: 'passphrase', label: 'Passphrase', type: 'password' },
    ],
  },
  yoco: {
    name: 'Yoco',
    description: 'Simple card payments for SA small businesses',
    logo: '/images/gateways/yoco.png',
    currencies: ['ZAR'],
    requiredFields: [
      { key: 'secret_key', label: 'Secret Key', type: 'password' },
      { key: 'public_key', label: 'Public Key', type: 'text' },
    ],
  },
  peach: {
    name: 'Peach Payments',
    description: 'Enterprise payment gateway with multi-currency',
    logo: '/images/gateways/peach.png',
    currencies: ['ZAR', 'USD', 'EUR', 'GBP'],
    requiredFields: [
      { key: 'entity_id', label: 'Entity ID', type: 'text' },
      { key: 'access_token', label: 'Access Token', type: 'password' },
    ],
  },
  ikhokha: {
    name: 'iKhokha',
    description: 'Mobile-first SA payment solution',
    logo: '/images/gateways/ikhokha.png',
    currencies: ['ZAR'],
    requiredFields: [
      { key: 'application_id', label: 'Application ID', type: 'text' },
      { key: 'application_secret', label: 'Application Secret', type: 'password' },
    ],
  },
  stripe: {
    name: 'Stripe',
    description: 'International payments with global reach',
    logo: '/images/gateways/stripe.png',
    currencies: ['ZAR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    requiredFields: [
      { key: 'secret_key', label: 'Secret Key', type: 'password' },
      { key: 'publishable_key', label: 'Publishable Key', type: 'text' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password' },
    ],
  },
}

/**
 * Create a payment gateway instance
 * 
 * @param code - Gateway code (payfast, yoco, peach, ikhokha, stripe)
 * @param config - Gateway configuration with credentials
 * @returns PaymentGateway instance
 */
export function createGateway(code: PaymentGatewayCode, config: GatewayConfig): PaymentGateway {
  const GatewayClass = GATEWAY_REGISTRY[code]
  
  if (!GatewayClass) {
    throw new Error(`Unknown payment gateway: ${code}`)
  }
  
  return new GatewayClass(config)
}

/**
 * Get list of available gateways for UI display
 */
export function getAvailableGateways(): Array<{
  code: PaymentGatewayCode
  name: string
  description: string
  currencies: string[]
}> {
  return Object.entries(GATEWAY_INFO).map(([code, info]) => ({
    code: code as PaymentGatewayCode,
    name: info.name,
    description: info.description,
    currencies: info.currencies,
  }))
}

/**
 * Get required credential fields for a gateway
 * Used by Master Admin to generate the credential input form
 */
export function getGatewayCredentialFields(code: PaymentGatewayCode) {
  return GATEWAY_INFO[code]?.requiredFields || []
}

/**
 * Validate credentials have all required fields
 */
export function validateCredentials(
  code: PaymentGatewayCode, 
  credentials: Record<string, string>
): { valid: boolean; missingFields: string[] } {
  const requiredFields = GATEWAY_INFO[code]?.requiredFields || []
  const missingFields = requiredFields
    .filter(field => !credentials[field.key] || credentials[field.key].trim() === '')
    .map(field => field.label)
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  }
}

