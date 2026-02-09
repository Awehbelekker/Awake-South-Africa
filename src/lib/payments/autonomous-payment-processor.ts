/**
 * Autonomous Payment Processor
 * 
 * Fully automated payment workflow for supplier invoices
 * 
 * Features:
 * - Automatic payment scheduling based on due dates
 * - Payment execution on scheduled date
 * - Retry logic for failed payments
 * - Payment status tracking
 * - Integration with payment gateways
 * - Email notifications
 */

import { createClient } from '@/lib/supabase/client'

export interface PaymentSchedule {
  id: string
  tenantId: string
  invoiceId: string
  scheduledDate: string
  amount: number
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled'
  paymentMethod?: string
  paymentReference?: string
  processedAt?: string
  errorMessage?: string
  autoRetryCount: number
}

export interface PaymentResult {
  success: boolean
  paymentReference?: string
  error?: string
  shouldRetry?: boolean
}

export interface PaymentGatewayConfig {
  gateway: 'payfast' | 'peach' | 'yoco' | 'ikhokha' | 'stripe' | 'manual'
  apiKey?: string
  merchantId?: string
  secretKey?: string
  testMode?: boolean
}

/**
 * Process scheduled payments that are due today
 * This should be run daily via cron job or scheduled task
 */
export async function processDuePayments(tenantId: string): Promise<{
  processed: number
  successful: number
  failed: number
  errors: string[]
}> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Get all scheduled payments due today or earlier
  const { data: duePayments, error } = await supabase
    .from('payment_schedules')
    .select(`
      *,
      invoice:supplier_invoices(
        id,
        invoice_number,
        total,
        supplier:suppliers(id, name, bank_details, preferred_payment_method)
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'scheduled')
    .lte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })

  if (error || !duePayments) {
    return {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [error?.message || 'Failed to fetch due payments'],
    }
  }

  let successful = 0
  let failed = 0
  const errors: string[] = []

  for (const payment of duePayments) {
    try {
      const result = await processPayment(payment as any, tenantId)
      
      if (result.success) {
        successful++
      } else {
        failed++
        if (result.error) {
          errors.push(`Payment ${payment.id}: ${result.error}`)
        }
      }
    } catch (error) {
      failed++
      errors.push(`Payment ${payment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    processed: duePayments.length,
    successful,
    failed,
    errors,
  }
}

/**
 * Process a single payment
 */
export async function processPayment(
  payment: PaymentSchedule & { invoice: any },
  tenantId: string
): Promise<PaymentResult> {
  const supabase = createClient()

  // Update status to processing
  await supabase
    .from('payment_schedules')
    .update({ status: 'processing' })
    .eq('id', payment.id)

  try {
    // Get payment gateway configuration for tenant
    const { data: config } = await supabase
      .from('tenant_payment_gateways')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    if (!config) {
      throw new Error('No active payment gateway configured')
    }

    // Determine payment method
    const paymentMethod = payment.invoice.supplier?.preferred_payment_method || config.gateway

    // Execute payment based on gateway
    let paymentResult: PaymentResult

    switch (paymentMethod) {
      case 'manual':
        paymentResult = await processManualPayment(payment)
        break
      case 'payfast':
        paymentResult = await processPayFastPayment(payment, config)
        break
      case 'stripe':
        paymentResult = await processStripePayment(payment, config)
        break
      default:
        paymentResult = {
          success: false,
          error: `Unsupported payment method: ${paymentMethod}`,
          shouldRetry: false,
        }
    }

    if (paymentResult.success) {
      // Mark payment as completed
      await supabase
        .from('payment_schedules')
        .update({
          status: 'completed',
          payment_reference: paymentResult.paymentReference,
          processed_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      // Update invoice payment status
      await supabase
        .from('supplier_invoices')
        .update({
          payment_status: 'paid',
          status: 'paid',
          amount_paid: payment.amount,
        })
        .eq('id', payment.invoiceId)

      return paymentResult
    } else {
      // Handle failure
      const retryCount = payment.autoRetryCount + 1
      const shouldRetry = paymentResult.shouldRetry && retryCount < 3

      if (shouldRetry) {
        // Schedule retry for tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)

        await supabase
          .from('payment_schedules')
          .update({
            status: 'scheduled',
            scheduled_date: tomorrow.toISOString().split('T')[0],
            auto_retry_count: retryCount,
            error_message: paymentResult.error,
          })
          .eq('id', payment.id)
      } else {
        // Mark as failed
        await supabase
          .from('payment_schedules')
          .update({
            status: 'failed',
            error_message: paymentResult.error,
          })
          .eq('id', payment.id)

        // Update invoice status
        await supabase
          .from('supplier_invoices')
          .update({ status: 'overdue' })
          .eq('id', payment.invoiceId)
      }

      return paymentResult
    }
  } catch (error) {
    // Mark as failed
    await supabase
      .from('payment_schedules')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', payment.id)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
      shouldRetry: true,
    }
  }
}

/**
 * Process manual payment (requires approval)
 */
async function processManualPayment(payment: PaymentSchedule & { invoice: any }): Promise<PaymentResult> {
  // Manual payments require human approval
  // Just mark as pending approval
  return {
    success: false,
    error: 'Manual payment requires approval',
    shouldRetry: false,
  }
}

/**
 * Process PayFast payment
 */
async function processPayFastPayment(
  payment: PaymentSchedule & { invoice: any },
  config: PaymentGatewayConfig
): Promise<PaymentResult> {
  // TODO: Implement PayFast API integration
  // For now, return placeholder
  return {
    success: false,
    error: 'PayFast integration not yet implemented',
    shouldRetry: false,
  }
}

/**
 * Process Stripe payment
 */
async function processStripePayment(
  payment: PaymentSchedule & { invoice: any },
  config: PaymentGatewayConfig
): Promise<PaymentResult> {
  // TODO: Implement Stripe API integration
  // For now, return placeholder
  return {
    success: false,
    error: 'Stripe integration not yet implemented',
    shouldRetry: false,
  }
}

/**
 * Check for overdue invoices and send notifications
 */
export async function checkOverdueInvoices(tenantId: string): Promise<{
  overdueCount: number
  notificationsSent: number
}> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Find invoices past due date
  const { data: overdueInvoices } = await supabase
    .from('supplier_invoices')
    .select('id, invoice_number, due_date, total, supplier:suppliers(name, email)')
    .eq('tenant_id', tenantId)
    .eq('payment_status', 'unpaid')
    .lt('due_date', today)

  if (!overdueInvoices || overdueInvoices.length === 0) {
    return { overdueCount: 0, notificationsSent: 0 }
  }

  // Update status to overdue
  await supabase
    .from('supplier_invoices')
    .update({ status: 'overdue' })
    .in('id', overdueInvoices.map((inv: any) => inv.id))

  // TODO: Send email notifications

  return {
    overdueCount: overdueInvoices.length,
    notificationsSent: 0, // Will be implemented with email service
  }
}
