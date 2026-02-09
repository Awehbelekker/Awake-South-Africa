/**
 * Payment Gateway Abstraction Layer
 * Unified interface for all South African payment gateways
 */

import { PaymentGatewayCode } from '@/types/supabase'

// ============================================
// PAYMENT REQUEST/RESPONSE TYPES
// ============================================

export interface PaymentParams {
  amount: number // Amount in ZAR (or specified currency)
  currency: string // 'ZAR', 'USD', 'EUR', 'GBP'
  orderId: string
  orderNumber: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  itemName: string
  itemDescription?: string
  successUrl: string
  cancelUrl: string
  notifyUrl: string // Webhook URL
  metadata?: Record<string, string>
}

export interface PaymentResult {
  success: boolean
  gatewayCode: PaymentGatewayCode
  paymentId: string // Gateway-specific payment ID
  redirectUrl?: string // URL to redirect customer to complete payment
  formData?: Record<string, string> // For form-based submissions (PayFast)
  formAction?: string // Form action URL
  error?: string
}

export interface WebhookData {
  rawBody: string
  headers: Record<string, string>
  signature?: string
}

export interface WebhookResult {
  valid: boolean
  orderId: string
  paymentId: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  amount: number
  gatewayCode: PaymentGatewayCode
  rawData?: Record<string, unknown>
  error?: string
}

export interface RefundParams {
  paymentId: string
  amount?: number // Partial refund if specified
  reason?: string
}

export interface RefundResult {
  success: boolean
  refundId: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  error?: string
}

// ============================================
// PAYMENT GATEWAY INTERFACE
// ============================================

export interface PaymentGateway {
  /** Gateway identifier code */
  readonly code: PaymentGatewayCode
  
  /** Display name for the gateway */
  readonly name: string
  
  /** Supported currencies */
  readonly supportedCurrencies: string[]
  
  /** Whether the gateway is in sandbox/test mode */
  readonly isSandbox: boolean

  /**
   * Create a new payment
   * Returns redirect URL or form data for customer to complete payment
   */
  createPayment(params: PaymentParams): Promise<PaymentResult>

  /**
   * Verify and process incoming webhook
   * Validates signature and returns parsed payment data
   */
  verifyWebhook(data: WebhookData): Promise<WebhookResult>

  /**
   * Get current status of a payment
   */
  getPaymentStatus(paymentId: string): Promise<WebhookResult>

  /**
   * Process a refund (full or partial)
   */
  refundPayment(params: RefundParams): Promise<RefundResult>
}

// ============================================
// GATEWAY CONFIGURATION
// ============================================

export interface GatewayConfig {
  gatewayCode: PaymentGatewayCode
  credentials: Record<string, string>
  isSandbox: boolean
  webhookUrl: string
}

// ============================================
// GATEWAY FACTORY TYPE
// ============================================

export type PaymentGatewayFactory = (config: GatewayConfig) => PaymentGateway

