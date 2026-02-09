/**
 * iKhokha Payment Gateway Adapter
 * South African mobile payment solution
 * Docs: https://developer.ikhokha.com/
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
import { IKhokhaCredentials, PaymentGatewayCode } from '@/types/supabase'

export class IKhokhaGateway implements PaymentGateway {
  readonly code: PaymentGatewayCode = 'ikhokha'
  readonly name = 'iKhokha'
  readonly supportedCurrencies = ['ZAR']
  readonly isSandbox: boolean

  private applicationId: string
  private applicationSecret: string
  private baseUrl: string

  constructor(config: GatewayConfig) {
    const creds = config.credentials as unknown as IKhokhaCredentials
    this.applicationId = creds.application_id
    this.applicationSecret = creds.application_secret
    this.isSandbox = config.isSandbox
    this.baseUrl = this.isSandbox
      ? 'https://api.ikhokha.com/sandbox'
      : 'https://api.ikhokha.com'
  }

  async createPayment(params: PaymentParams): Promise<PaymentResult> {
    try {
      const payload = {
        amount: Math.round(params.amount * 100), // Amount in cents
        currency: 'ZAR',
        externalId: params.orderId,
        description: params.itemName,
        customer: {
          email: params.customerEmail,
          name: params.customerName,
          phone: params.customerPhone,
        },
        redirectUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        webhookUrl: params.notifyUrl,
      }

      const signature = this.generateSignature(JSON.stringify(payload))

      const response = await fetch(`${this.baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Application-Id': this.applicationId,
          'X-Signature': signature,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          gatewayCode: this.code,
          paymentId: '',
          error: `iKhokha error: ${error.message || 'Unknown error'}`,
        }
      }

      const data = await response.json()

      return {
        success: true,
        gatewayCode: this.code,
        paymentId: data.paymentId,
        redirectUrl: data.paymentUrl,
      }
    } catch (error) {
      return {
        success: false,
        gatewayCode: this.code,
        paymentId: '',
        error: `iKhokha checkout failed: ${error}`,
      }
    }
  }

  async verifyWebhook(data: WebhookData): Promise<WebhookResult> {
    const signature = data.headers['x-signature'] || ''
    const expectedSignature = this.generateSignature(data.rawBody)

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

    return {
      valid: true,
      orderId: payload.externalId || '',
      paymentId: payload.paymentId,
      status: this.mapStatus(payload.status),
      amount: (payload.amount || 0) / 100,
      gatewayCode: this.code,
      rawData: payload,
    }
  }

  async getPaymentStatus(paymentId: string): Promise<WebhookResult> {
    const signature = this.generateSignature(paymentId)
    
    const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
      headers: {
        'X-Application-Id': this.applicationId,
        'X-Signature': signature,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch iKhokha payment status')
    }

    const data = await response.json()

    return {
      valid: true,
      orderId: data.externalId || '',
      paymentId: data.paymentId,
      status: this.mapStatus(data.status),
      amount: (data.amount || 0) / 100,
      gatewayCode: this.code,
      rawData: data,
    }
  }

  async refundPayment(_params: RefundParams): Promise<RefundResult> {
    throw new Error('iKhokha refunds must be processed through the iKhokha dashboard.')
  }

  private generateSignature(data: string): string {
    return crypto.createHmac('sha256', this.applicationSecret).update(data).digest('hex')
  }

  private mapStatus(status: string): 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED' {
    switch (status?.toLowerCase()) {
      case 'successful':
      case 'completed':
      case 'paid': return 'PAID'
      case 'failed': return 'FAILED'
      case 'cancelled': return 'CANCELLED'
      case 'refunded': return 'REFUNDED'
      default: return 'PENDING'
    }
  }
}

