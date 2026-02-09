/**
 * Yoco Payment Gateway Adapter
 * South African payment gateway popular with small businesses
 * Docs: https://developer.yoco.com/online/
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
import { YocoCredentials, PaymentGatewayCode } from '@/types/supabase'

export class YocoGateway implements PaymentGateway {
  readonly code: PaymentGatewayCode = 'yoco'
  readonly name = 'Yoco'
  readonly supportedCurrencies = ['ZAR']
  readonly isSandbox: boolean

  private secretKey: string
  private publicKey: string
  private webhookSecret: string
  private baseUrl = 'https://payments.yoco.com/api'

  constructor(config: GatewayConfig) {
    const creds = config.credentials as unknown as YocoCredentials
    this.secretKey = creds.secret_key
    this.publicKey = creds.public_key
    this.webhookSecret = (config.credentials as Record<string, string>).webhook_secret || ''
    this.isSandbox = config.isSandbox
  }

  async createPayment(params: PaymentParams): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(params.amount * 100), // Convert to cents
          currency: params.currency || 'ZAR',
          cancelUrl: params.cancelUrl,
          successUrl: params.successUrl,
          failureUrl: params.cancelUrl,
          metadata: {
            orderNumber: params.orderNumber,
            orderId: params.orderId,
            customerEmail: params.customerEmail,
            customerName: params.customerName,
            ...params.metadata,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          gatewayCode: this.code,
          paymentId: '',
          error: `Yoco API error: ${error.message || 'Unknown error'}`,
        }
      }

      const data = await response.json()

      return {
        success: true,
        gatewayCode: this.code,
        paymentId: data.id,
        redirectUrl: data.redirectUrl,
      }
    } catch (error) {
      return {
        success: false,
        gatewayCode: this.code,
        paymentId: '',
        error: `Yoco checkout failed: ${error}`,
      }
    }
  }

  async verifyWebhook(data: WebhookData): Promise<WebhookResult> {
    const signature = data.headers['yoco-signature'] || data.signature || ''
    
    // Verify HMAC signature
    const hmac = crypto.createHmac('sha256', this.webhookSecret)
    hmac.update(data.rawBody)
    const expectedSignature = hmac.digest('hex')

    if (signature !== expectedSignature) {
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

    const payload = JSON.parse(data.rawBody)
    const metadata = payload.metadata || {}

    return {
      valid: true,
      orderId: metadata.orderId || '',
      paymentId: payload.id,
      status: this.mapStatus(payload.status),
      amount: (payload.amount || 0) / 100, // Convert from cents
      gatewayCode: this.code,
      rawData: payload,
    }
  }

  async getPaymentStatus(paymentId: string): Promise<WebhookResult> {
    const response = await fetch(`${this.baseUrl}/checkouts/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${this.secretKey}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Yoco payment status')
    }

    const data = await response.json()
    const metadata = data.metadata || {}

    return {
      valid: true,
      orderId: metadata.orderId || '',
      paymentId: data.id,
      status: this.mapStatus(data.status),
      amount: (data.amount || 0) / 100,
      gatewayCode: this.code,
      rawData: data,
    }
  }

  async refundPayment(_params: RefundParams): Promise<RefundResult> {
    // Yoco refunds require their dashboard or specific API access
    throw new Error('Yoco refunds must be processed through the Yoco dashboard.')
  }

  private mapStatus(status: string): 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED' {
    switch (status?.toLowerCase()) {
      case 'successful':
      case 'completed': return 'PAID'
      case 'failed': return 'FAILED'
      case 'cancelled': return 'CANCELLED'
      case 'refunded': return 'REFUNDED'
      default: return 'PENDING'
    }
  }
}

