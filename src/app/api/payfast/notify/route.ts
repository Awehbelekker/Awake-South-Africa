import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Medusa Admin API URL
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const MEDUSA_ADMIN_SECRET = process.env.MEDUSA_ADMIN_SECRET || '';

// Capture payment in Medusa (marks order as paid)
async function capturePaymentInMedusa(orderId: string): Promise<boolean> {
  try {
    // Get order details to find payment ID
    const orderResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${MEDUSA_ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!orderResponse.ok) {
      console.error('Failed to fetch order from Medusa:', await orderResponse.text());
      return false;
    }

    const { order } = await orderResponse.json();

    // Check if order has payments to capture
    if (!order.payments || order.payments.length === 0) {
      console.log('No payments found for order:', orderId);
      return false;
    }

    // Capture the payment
    const paymentId = order.payments[0].id;
    const captureResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MEDUSA_ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      console.error('Failed to capture payment in Medusa:', await captureResponse.text());
      return false;
    }

    console.log(`Payment captured successfully for order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error capturing payment in Medusa:', error);
    return false;
  }
}

// Add note to order with PayFast transaction details
async function addPayFastNoteToOrder(orderId: string, payfastData: Record<string, string>): Promise<void> {
  try {
    const note = `PayFast Payment Confirmed
- Transaction ID: ${payfastData.pf_payment_id || 'N/A'}
- Amount: R${payfastData.amount_gross || '0'}
- Payment Status: ${payfastData.payment_status}
- Payment Date: ${new Date().toISOString()}`;

    await fetch(`${MEDUSA_BACKEND_URL}/admin/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MEDUSA_ADMIN_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resource_type: 'order',
        resource_id: orderId,
        value: note,
      }),
    });
  } catch (error) {
    console.error('Failed to add note to order:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const data: Record<string, string> = {};

    params.forEach((value, key) => {
      data[key] = value;
    });

    // Extract signature
    const signature = data.signature;
    delete data.signature;

    // Verify signature
    const passPhrase = process.env.PAYFAST_PASSPHRASE || '';
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

    if (signature !== calculatedSignature) {
      console.error('Invalid PayFast signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Extract payment data
    const paymentStatus = data.payment_status;
    const orderId = data.m_payment_id; // This is the Medusa order ID (e.g., "order_xxx")
    const amount = data.amount_gross;
    const payfastPaymentId = data.pf_payment_id;

    console.log('PayFast Payment Notification:', {
      orderId,
      payfastPaymentId,
      status: paymentStatus,
      amount,
    });

    // Only process COMPLETE payments
    if (paymentStatus === 'COMPLETE') {
      // Check if this is a Medusa order ID (starts with "order_")
      if (orderId && orderId.startsWith('order_')) {
        // Capture payment in Medusa
        const captured = await capturePaymentInMedusa(orderId);

        if (captured) {
          // Add PayFast transaction note to order
          await addPayFastNoteToOrder(orderId, data);
          console.log(`Order ${orderId} payment captured and noted`);
        }
      } else {
        // Legacy order ID format (AWK-xxx), log for manual processing
        console.log(`Legacy order format detected: ${orderId}. Manual processing may be required.`);
      }
    } else {
      console.log(`Payment not complete. Status: ${paymentStatus}`);
    }

    // PayFast expects a 200 OK response
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PayFast webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
