/**
 * PayFast Payment Gateway Adapter
 * South African payment gateway for cards, EFT, and mobile payments
 * Docs: https://developers.payfast.co.za/docs
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
import { PayFastCredentials, PaymentGatewayCode } from '@/types/supabase'

export class PayFastGateway implements PaymentGateway {
  readonly code: PaymentGatewayCode = 'payfast'
  readonly name = 'PayFast'
  readonly supportedCurrencies = ['ZAR']
  readonly isSandbox: boolean

  private merchantId: string
  private merchantKey: string
  private passphrase: string
  private baseUrl: string

  constructor(config: GatewayConfig) {
    const creds = config.credentials as unknown as PayFastCredentials
    this.merchantId = creds.merchant_id
    this.merchantKey = creds.merchant_key
    this.passphrase = creds.passphrase
    this.isSandbox = config.isSandbox
    this.baseUrl = this.isSandbox
      ? 'https://sandbox.payfast.co.za'
      : 'https://www.payfast.co.za'
  }

  async createPayment(params: PaymentParams): Promise<PaymentResult> {
    const [firstName, ...lastNameParts] = params.customerName.split(' ')
    const lastName = lastNameParts.join(' ') || firstName

    const data: Record<string, string> = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: params.successUrl,
      cancel_url: params.cancelUrl,
      notify_url: params.notifyUrl,
      name_first: firstName,
      name_last: lastName,
      email_address: params.customerEmail,
      m_payment_id: params.orderId,
      amount: params.amount.toFixed(2),
      item_name: params.itemName,
      item_description: params.itemDescription || params.itemName,
    }

    const signature = this.generateSignature(data)

    return {
      success: true,
      gatewayCode: this.code,
      paymentId: params.orderId,
      formAction: `${this.baseUrl}/eng/process`,
      formData: { ...data, signature },
    }
  }

  async verifyWebhook(data: WebhookData): Promise<WebhookResult> {
    const params = new URLSearchParams(data.rawBody)
    const webhookData: Record<string, string> = {}
    params.forEach((value, key) => { webhookData[key] = value })

    const receivedSignature = webhookData.signature || ''
    const { signature, ...dataWithoutSignature } = webhookData
    const isValid = this.verifySignature(dataWithoutSignature, receivedSignature)

    if (!isValid) {
      return {
        valid: false,
        orderId: webhookData.m_payment_id || '',
        paymentId: webhookData.pf_payment_id || '',
        status: 'FAILED',
        amount: parseFloat(webhookData.amount_gross || '0'),
        gatewayCode: this.code,
        error: 'Invalid signature',
      }
    }

    return {
      valid: true,
      orderId: webhookData.m_payment_id,
      paymentId: webhookData.pf_payment_id,
      status: this.mapStatus(webhookData.payment_status),
      amount: parseFloat(webhookData.amount_gross),
      gatewayCode: this.code,
      rawData: webhookData,
    }
  }

  async getPaymentStatus(_paymentId: string): Promise<WebhookResult> {
    // PayFast doesn't have a status check API - relies on webhooks
    throw new Error('PayFast does not support payment status polling. Use webhooks.')
  }

  async refundPayment(_params: RefundParams): Promise<RefundResult> {
    // PayFast refunds are done through their dashboard
    throw new Error('PayFast refunds must be processed through the PayFast dashboard.')
  }

  private generateSignature(data: Record<string, string>): string {
    const paramString = Object.keys(data)
      .filter(key => key !== 'signature')
      .sort()
      .map(key => `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}`)
      .join('&')

    const stringToHash = this.passphrase 
      ? `${paramString}&passphrase=${this.passphrase}` 
      : paramString

    return crypto.createHash('md5').update(stringToHash).digest('hex')
  }

  private verifySignature(data: Record<string, string>, signature: string): boolean {
    const calculated = this.generateSignature(data)
    return calculated === signature
  }

  private mapStatus(status: string): 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED' {
    switch (status?.toUpperCase()) {
      case 'COMPLETE': return 'PAID'
      case 'FAILED': return 'FAILED'
      case 'CANCELLED': return 'CANCELLED'
      default: return 'PENDING'
    }
  }
}

