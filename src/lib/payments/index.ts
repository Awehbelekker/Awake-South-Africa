/**
 * Payment Gateway Module
 * 
 * This module provides a unified interface for all payment gateways.
 * 
 * Usage for processing a payment:
 * ```typescript
 * import { processPayment } from '@/lib/payments'
 * 
 * const result = await processPayment(tenantId, 'payfast', {
 *   amount: 1500,
 *   currency: 'ZAR',
 *   orderId: 'order-123',
 *   orderNumber: 'AWK-001',
 *   customerEmail: 'customer@example.com',
 *   customerName: 'John Doe',
 *   itemName: 'Efoil Board',
 *   successUrl: 'https://store.com/success',
 *   cancelUrl: 'https://store.com/cancel',
 *   notifyUrl: 'https://store.com/api/webhooks/payfast',
 * })
 * 
 * if (result.success) {
 *   // Redirect to result.redirectUrl or submit result.formData
 * }
 * ```
 * 
 * For Master Admin - getting available gateways:
 * ```typescript
 * import { getAvailableGateways, getGatewayCredentialFields } from '@/lib/payments'
 * 
 * const gateways = getAvailableGateways() // List all gateways
 * const fields = getGatewayCredentialFields('payfast') // Get form fields
 * ```
 */

// Types
export type {
  PaymentGateway,
  PaymentParams,
  PaymentResult,
  WebhookData,
  WebhookResult,
  RefundParams,
  RefundResult,
  GatewayConfig,
} from './types'

// Gateway Factory (for Master Admin)
export {
  createGateway,
  getAvailableGateways,
  getGatewayCredentialFields,
  validateCredentials,
  GATEWAY_INFO,
} from './factory'

// Tenant Payment Service (for checkout/processing)
export {
  getTenantGateways,
  getTenantGateway,
  getDefaultTenantGateway,
  processPayment,
  verifyWebhook,
  getAvailableGateways,
} from './tenant-payment-service'

// Individual Gateway Classes (for advanced usage)
export { PayFastGateway } from './payfast-gateway'
export { YocoGateway } from './yoco-gateway'
export { PeachPaymentsGateway } from './peach-gateway'
export { IKhokhaGateway } from './ikhokha-gateway'
export { StripeGateway } from './stripe-gateway'

