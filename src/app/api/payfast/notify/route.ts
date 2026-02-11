import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OrderService } from '../../../../lib/services/order.service';

/**
 * PayFast IPN (Instant Payment Notification) Webhook Handler
 * 
 * This endpoint receives payment notifications from PayFast and updates
 * the order status in Supabase when payment is confirmed.
 * 
 * @see https://developers.payfast.co.za/docs#instant_transaction_notification
 */

// Verify PayFast signature
function verifyPayFastSignature(
  data: Record<string, string>,
  signature: string,
  passPhrase: string = ''
): boolean {
  let pfParamString = '';
  const sortedKeys = Object.keys(data).sort();

  for (const key of sortedKeys) {
    if (data[key] !== '') {
      pfParamString += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }

  pfParamString = pfParamString.slice(0, -1);

  if (passPhrase) {
    pfParamString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`;
  }

  const calculatedSignature = crypto.createHash('md5').update(pfParamString).digest('hex');
  return signature === calculatedSignature;
}

export async function POST(request: NextRequest) {
  try {
    // Parse PayFast POST data
    const body = await request.text();
    const params = new URLSearchParams(body);
    const data: Record<string, string> = {};

    params.forEach((value, key) => {
      data[key] = value;
    });

    console.log('PayFast IPN Received:', {
      payment_id: data.pf_payment_id,
      order_number: data.m_payment_id,
      status: data.payment_status,
      amount: data.amount_gross,
    });

    // Extract and remove signature
    const signature = data.signature;
    delete data.signature;

    // Verify signature
    const passPhrase = process.env.PAYFAST_PASSPHRASE || '';
    const isValidSignature = verifyPayFastSignature(data, signature, passPhrase);

    if (!isValidSignature) {
      console.error('❌ Invalid PayFast signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('✅ PayFast signature verified');

    // Extract payment data
    const paymentStatus = data.payment_status;
    const orderNumber = data.m_payment_id; // Order number (e.g., "AWK-xxx-xxx")
    const amountGross = parseFloat(data.amount_gross || '0');
    const payfastPaymentId = data.pf_payment_id;

    // Only process COMPLETE payments
    if (paymentStatus !== 'COMPLETE') {
      console.log(`⏸️  Payment not complete. Status: ${paymentStatus}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Payment not yet complete' 
      });
    }

    // Get order by order number
    const { success, data: order, error } = await OrderService.getOrderByNumber(orderNumber);

    if (!success || !order) {
      console.error('❌ Order not found:', orderNumber, error);
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      console.log('⚠️  Order already marked as paid:', orderNumber);
      return NextResponse.json({ 
        success: true, 
        message: 'Order already paid' 
      });
    }

    // Verify amount matches
    const orderTotal = parseFloat(order.total);
    if (Math.abs(orderTotal - amountGross) > 0.01) {
      console.error('❌ Amount mismatch:', {
        expected: orderTotal,
        received: amountGross,
      });
      return NextResponse.json(
        { error: 'Amount mismatch' }, 
        { status: 400 }
      );
    }

    // Mark order as paid
    const updateResult = await OrderService.markOrderAsPaid(
      order.id,
      payfastPaymentId,
      'payfast'
    );

    if (!updateResult.success) {
      console.error('❌ Failed to update order:', updateResult.error);
      return NextResponse.json(
        { error: 'Failed to update order' }, 
        { status: 500 }
      );
    }

    console.log(`✅ Order ${orderNumber} marked as paid. PayFast ID: ${payfastPaymentId}`);

    // TODO: Send order confirmation email to customer
    // TODO: Send notification to admin
    // TODO: Trigger fulfillment workflow

    // PayFast expects a 200 OK response
    return NextResponse.json({ 
      success: true,
      message: 'Payment processed successfully' 
    });

  } catch (error) {
    console.error('❌ PayFast webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    );
  }
}

// GET handler for testing (not used by PayFast)
export async function GET() {
  return NextResponse.json({
    message: 'PayFast IPN endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}
