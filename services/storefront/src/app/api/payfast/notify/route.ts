import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

    // Verify payment status
    const paymentStatus = data.payment_status;
    const paymentId = data.m_payment_id;
    const amount = data.amount_gross;

    console.log('PayFast Payment Notification:', {
      paymentId,
      status: paymentStatus,
      amount,
    });

    // Here you would:
    // 1. Update your database with payment status
    // 2. Send confirmation email
    // 3. Process the order

    // For now, just log and return success
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PayFast webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
