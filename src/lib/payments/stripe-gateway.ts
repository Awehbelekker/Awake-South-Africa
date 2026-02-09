/**
 * Stripe Payment Gateway Adapter
 * International payment gateway for global transactions
 * Docs: https://stripe.com/docs/api
 */

import crypto from 'crypto'
import {
  PaymentGateway,
  PaymentParams,
  PaymentResult,
  WebhookData,
  WebhookResult,
  RefundParams,
  RefundResult,
  GatewayConfig,
} from './types'
import { StripeCredentials, PaymentGatewayCode } from '@/types/supabase'

export class StripeGateway implements PaymentGateway {
  readonly code: PaymentGatewayCode = 'stripe'
  readonly name = 'Stripe'
  readonly supportedCurrencies = ['ZAR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD']
  readonly isSandbox: boolean

  private secretKey: string
  private webhookSecret: string
  private baseUrl = 'https://api.stripe.com/v1'

  constructor(config: GatewayConfig) {
    const creds = config.credentials as unknown as StripeCredentials
    this.secretKey = creds.secret_key
    this.webhookSecret = creds.webhook_secret
    this.isSandbox = config.isSandbox
  }

  async createPayment(params: PaymentParams): Promise<PaymentResult> {
    try {
      // Create Checkout Session
      const formData = new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': params.currency.toLowerCase(),
        'line_items[0][price_data][product_data][name]': params.itemName,
        'line_items[0][price_data][unit_amount]': Math.round(params.amount * 100).toString(),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': params.cancelUrl,
        'customer_email': params.customerEmail,
        'client_reference_id': params.orderId,
        'metadata[orderId]': params.orderId,
        'metadata[orderNumber]': params.orderNumber,
      })

      const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          gatewayCode: this.code,
          paymentId: '',
          error: `Stripe error: ${error.error?.message || 'Unknown error'}`,
        }
      }

      const data = await response.json()

      return {
        success: true,
        gatewayCode: this.code,
        paymentId: data.id,
        redirectUrl: data.url,
      }
    } catch (error) {
      return {
        success: false,
        gatewayCode: this.code,
        paymentId: '',
        error: `Stripe checkout failed: ${error}`,
      }
    }
  }

  async verifyWebhook(data: WebhookData): Promise<WebhookResult> {
    const signature = data.headers['stripe-signature'] || ''
    
    // Verify Stripe webhook signature
    const isValid = this.verifyStripeSignature(data.rawBody, signature)

    if (!isValid) {
      return {
        valid: false,
        orderId: '',
        paymentId: '',
        status: 'FAILED',
        amount: 0,
        gatewayCode: this.code,
        error: 'Invalid webhook signature',
      }
    }

    const event = JSON.parse(data.rawBody)
    const session = event.data?.object

    return {
      valid: true,
      orderId: session?.metadata?.orderId || session?.client_reference_id || '',
      paymentId: session?.id || event.id,
      status: this.mapEventType(event.type),
      amount: (session?.amount_total || 0) / 100,
      gatewayCode: this.code,
      rawData: event,
    }
  }

  async getPaymentStatus(paymentId: string): Promise<WebhookResult> {
    const response = await fetch(`${this.baseUrl}/checkout/sessions/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${this.secretKey}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Stripe payment status')
    }

    const data = await response.json()

    return {
      valid: true,
      orderId: data.metadata?.orderId || data.client_reference_id || '',
      paymentId: data.id,
      status: this.mapSessionStatus(data.payment_status),
      amount: (data.amount_total || 0) / 100,
      gatewayCode: this.code,
      rawData: data,
    }
  }

  async refundPayment(params: RefundParams): Promise<RefundResult> {
    const formData = new URLSearchParams({
      payment_intent: params.paymentId,
      ...(params.amount && { amount: Math.round(params.amount * 100).toString() }),
      ...(params.reason && { reason: 'requested_by_customer' }),
    })

    const response = await fetch(`${this.baseUrl}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()

    return {
      success: data.status === 'succeeded',
      refundId: data.id || '',
      amount: (data.amount || 0) / 100,
      status: data.status === 'succeeded' ? 'COMPLETED' : 'FAILED',
      error: data.error?.message,
    }
  }

  private verifyStripeSignature(payload: string, signature: string): boolean {
    const elements = signature.split(',')
    const signatureMap: Record<string, string> = {}
    elements.forEach(el => {
      const [key, value] = el.split('=')
      signatureMap[key] = value
    })

    const timestamp = signatureMap['t']
    const sig = signatureMap['v1']

    if (!timestamp || !sig) return false

    const signedPayload = `${timestamp}.${payload}`
    const expectedSig = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex')

    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  }

  private mapEventType(type: string): 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED' {
    switch (type) {
      case 'checkout.session.completed': return 'PAID'
      case 'payment_intent.succeeded': return 'PAID'
      case 'payment_intent.payment_failed': return 'FAILED'
      case 'charge.refunded': return 'REFUNDED'
      default: return 'PENDING'
    }
  }

  private mapSessionStatus(status: string): 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED' {
    switch (status) {
      case 'paid': return 'PAID'
      case 'unpaid': return 'PENDING'
      case 'no_payment_required': return 'PAID'
      default: return 'PENDING'
    }
  }
}

