/**
 * Peach Payments Gateway Adapter
 * Enterprise South African payment gateway
 * Docs: https://developer.peachpayments.com/
 */

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
import { PeachPaymentsCredentials, PaymentGatewayCode } from '@/types/supabase'

export class PeachPaymentsGateway implements PaymentGateway {
  readonly code: PaymentGatewayCode = 'peach'
  readonly name = 'Peach Payments'
  readonly supportedCurrencies = ['ZAR', 'USD', 'EUR', 'GBP']
  readonly isSandbox: boolean

  private entityId: string
  private accessToken: string
  private baseUrl: string

  constructor(config: GatewayConfig) {
    const creds = config.credentials as unknown as PeachPaymentsCredentials
    this.entityId = creds.entity_id
    this.accessToken = creds.access_token
    this.isSandbox = config.isSandbox
    this.baseUrl = this.isSandbox
      ? 'https://eu-test.oppwa.com'
      : 'https://eu-prod.oppwa.com'
  }

  async createPayment(params: PaymentParams): Promise<PaymentResult> {
    try {
      const formData = new URLSearchParams({
        entityId: this.entityId,
        amount: params.amount.toFixed(2),
        currency: params.currency || 'ZAR',
        paymentType: 'DB', // Debit (direct charge)
        'customer.email': params.customerEmail,
        'customer.givenName': params.customerName.split(' ')[0],
        'customer.surname': params.customerName.split(' ').slice(1).join(' ') || 'Customer',
        'merchantTransactionId': params.orderId,
        'shopperResultUrl': params.successUrl,
      })

      const response = await fetch(`${this.baseUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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
          error: `Peach Payments error: ${error.result?.description || 'Unknown error'}`,
        }
      }

      const data = await response.json()

      // Peach returns a checkout ID for redirect
      const checkoutId = data.id
      const redirectUrl = `${this.baseUrl}/v1/paymentWidgets.js?checkoutId=${checkoutId}`

      return {
        success: true,
        gatewayCode: this.code,
        paymentId: checkoutId,
        redirectUrl,
        formData: {
          checkoutId,
          shopperResultUrl: params.successUrl,
        },
      }
    } catch (error) {
      return {
        success: false,
        gatewayCode: this.code,
        paymentId: '',
        error: `Peach Payments checkout failed: ${error}`,
      }
    }
  }

  async verifyWebhook(data: WebhookData): Promise<WebhookResult> {
    const payload = JSON.parse(data.rawBody)

    // Peach uses result codes for status
    const resultCode = payload.result?.code || ''
    const isSuccess = resultCode.startsWith('000.') || resultCode.startsWith('000.100')

    return {
      valid: true, // Peach doesn't require signature verification for all webhooks
      orderId: payload.merchantTransactionId || '',
      paymentId: payload.id,
      status: isSuccess ? 'PAID' : this.mapResultCode(resultCode),
      amount: parseFloat(payload.amount || '0'),
      gatewayCode: this.code,
      rawData: payload,
    }
  }

  async getPaymentStatus(paymentId: string): Promise<WebhookResult> {
    const response = await fetch(
      `${this.baseUrl}/v1/query/${paymentId}?entityId=${this.entityId}`,
      {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch Peach payment status')
    }

    const data = await response.json()
    const resultCode = data.result?.code || ''
    const isSuccess = resultCode.startsWith('000.')

    return {
      valid: true,
      orderId: data.merchantTransactionId || '',
      paymentId: data.id,
      status: isSuccess ? 'PAID' : this.mapResultCode(resultCode),
      amount: parseFloat(data.amount || '0'),
      gatewayCode: this.code,
      rawData: data,
    }
  }

  async refundPayment(params: RefundParams): Promise<RefundResult> {
    const formData = new URLSearchParams({
      entityId: this.entityId,
      amount: params.amount?.toFixed(2) || '0',
      currency: 'ZAR',
      paymentType: 'RF', // Refund
    })

    const response = await fetch(`${this.baseUrl}/v1/payments/${params.paymentId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()
    const isSuccess = data.result?.code?.startsWith('000.')

    return {
      success: isSuccess,
      refundId: data.id || '',
      amount: params.amount || 0,
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      error: isSuccess ? undefined : data.result?.description,
    }
  }

  private mapResultCode(code: string): 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED' {
    if (code.startsWith('000.')) return 'PAID'
    if (code.startsWith('100.')) return 'PENDING'
    if (code.startsWith('800.')) return 'CANCELLED'
    return 'FAILED'
  }
}

