export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Look up the default tenant ID (awake-sa slug fallback). */
async function getDefaultTenantId(): Promise<string | null> {
  const slug = process.env.DEFAULT_TENANT_SLUG || 'awake-sa';
  const { data } = await getSupabase()
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id || null;
}

/** Generate an invoice number like INV-20260220-0001. */
function generateInvoiceNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${ymd}-${rand}`;
}

/** Send a plain-text order confirmation email. Returns silently on failure. */
async function sendOrderConfirmationEmail(opts: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  total: number;
  itemDescription: string;
  payfastId: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  const storeName = process.env.STORE_NAME || 'Awake Boards SA';
  const storeEmail = process.env.SMTP_USER;
  const totalFormatted = `R ${opts.total.toFixed(2)}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Order Confirmation</title></head>
      <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
        <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <div style="background:#111827;padding:24px 20px;color:#fff;">
            <h1 style="margin:0;font-size:22px;">Order Confirmed ✓</h1>
          </div>
          <div style="padding:28px 24px;">
            <p style="margin:0 0 16px;color:#111;">Hi ${opts.customerName},</p>
            <p style="margin:0 0 16px;color:#555;">
              Thank you for your order! Your payment has been received and we'll get it ready for dispatch shortly.
            </p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <tr style="background:#f9fafb;">
                <td style="padding:10px 12px;font-weight:600;color:#374151;border:1px solid #e5e7eb;">Order Reference</td>
                <td style="padding:10px 12px;color:#111;border:1px solid #e5e7eb;">${opts.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-weight:600;color:#374151;border:1px solid #e5e7eb;">Items</td>
                <td style="padding:10px 12px;color:#111;border:1px solid #e5e7eb;">${opts.itemDescription}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:10px 12px;font-weight:600;color:#374151;border:1px solid #e5e7eb;">Amount Paid</td>
                <td style="padding:10px 12px;color:#16a34a;font-weight:700;border:1px solid #e5e7eb;">${totalFormatted}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-weight:600;color:#374151;border:1px solid #e5e7eb;">Payment ID</td>
                <td style="padding:10px 12px;color:#6b7280;font-size:12px;border:1px solid #e5e7eb;">${opts.payfastId}</td>
              </tr>
            </table>
            <p style="margin:20px 0 8px;color:#555;">
              We'll send you a shipping update once your order is dispatched.
              If you have any questions, reply to this email or contact us at <a href="mailto:${storeEmail}" style="color:#3b82f6;">${storeEmail}</a>.
            </p>
            <p style="margin:0;color:#111;">Ride on 🤙<br><strong>${storeName}</strong></p>
          </div>
          <div style="background:#f9fafb;padding:14px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated confirmation — please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `${storeName} <${storeEmail}>`,
      to: opts.customerEmail,
      subject: `Your ${storeName} order ${opts.orderNumber} is confirmed!`,
      html,
    });
    console.log(`✅ Confirmation email sent to ${opts.customerEmail}`);
  } catch (err) {
    console.error('⚠️  Confirmation email failed (non-fatal):', err);
  }
}

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
    params.forEach((value, key) => { data[key] = value; });

    console.log('PayFast IPN Received:', {
      payment_id: data.pf_payment_id,
      order_number: data.m_payment_id,
      status: data.payment_status,
      amount: data.amount_gross,
    });

    // Extract and remove signature before verification
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
    const orderNumber   = data.m_payment_id;
    const amountGross   = parseFloat(data.amount_gross || '0');
    const pfPaymentId   = data.pf_payment_id;
    const customerEmail = data.email_address || '';
    const customerName  = [data.name_first, data.name_last].filter(Boolean).join(' ') || 'Customer';
    const itemDesc      = data.item_description || data.item_name || 'Awake SA Order';

    // Only process COMPLETE payments
    if (paymentStatus !== 'COMPLETE') {
      console.log(`⏸️  Payment not complete. Status: ${paymentStatus}`);
      return NextResponse.json({ success: true, message: 'Payment not yet complete' });
    }

    // ── 1. Resolve tenant ────────────────────────────────────────────────────
    const tenantId = await getDefaultTenantId();
    const supabase = getSupabase();

    // ── 2. Upsert order ──────────────────────────────────────────────────────
    // Try to find existing order by order_number
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, payment_status, total, customer_email, customer_name')
      .eq('order_number', orderNumber)
      .maybeSingle();

    let orderId: string;
    let finalCustomerEmail = customerEmail;
    let finalCustomerName  = customerName;

    if (existingOrder) {
      // ── Order found: check idempotency ───────────────────────────────────
      if (existingOrder.payment_status === 'paid') {
        console.log('⚠️  Order already paid, skipping duplicate IPN:', orderNumber);
        return NextResponse.json({ success: true, message: 'Already processed' });
      }
      // Amount check (only if total stored and non-zero)
      const storedTotal = parseFloat(existingOrder.total || '0');
      if (storedTotal > 0 && Math.abs(storedTotal - amountGross) > 0.01) {
        console.error('❌ Amount mismatch:', { expected: storedTotal, received: amountGross });
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }
      // Mark as paid
      await supabase
        .from('orders')
        .update({
          payment_status:    'paid',
          payment_reference: pfPaymentId,
          payment_method:    'payfast',
          paid_at:           new Date().toISOString(),
          status:            'confirmed',
          updated_at:        new Date().toISOString(),
        })
        .eq('id', existingOrder.id);

      orderId             = existingOrder.id;
      finalCustomerEmail  = existingOrder.customer_email || customerEmail;
      finalCustomerName   = existingOrder.customer_name  || customerName;
      console.log(`✅ Existing order ${orderNumber} marked as paid.`);
    } else {
      // ── Order NOT in DB (checkout skipped pre-creation): create it now ───
      const tax      = Math.round(amountGross * 15 / 115 * 100) / 100; // VAT-inclusive
      const subtotal = Math.round((amountGross - tax) * 100) / 100;

      const newOrderData: Record<string, unknown> = {
        order_number:      orderNumber,
        customer_email:    customerEmail,
        customer_name:     customerName,
        items:             [{ description: itemDesc, quantity: 1, unitPrice: amountGross, total: amountGross }],
        subtotal,
        tax_amount:        tax,
        shipping_amount:   0,
        discount_amount:   0,
        total:             amountGross,
        currency:          'ZAR',
        status:            'confirmed',
        payment_status:    'paid',
        payment_reference: pfPaymentId,
        payment_method:    'payfast',
        payment_gateway:   'payfast',
        paid_at:           new Date().toISOString(),
        fulfillment_status:'unfulfilled',
      };
      if (tenantId) newOrderData.tenant_id = tenantId;

      const { data: newOrder, error: createErr } = await supabase
        .from('orders')
        .insert(newOrderData)
        .select('id')
        .single();

      if (createErr) {
        console.error('❌ Failed to create order record:', createErr.message);
        // Non-fatal: still create invoice and send email below
        orderId = orderNumber; // fallback to order number string
      } else {
        orderId = newOrder.id;
        console.log(`✅ Created new order record for ${orderNumber}.`);
      }
    }

    // ── 3. Create invoice (idempotent — skip if already exists) ────────────
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('reference_id', orderNumber)
      .maybeSingle();

    if (!existingInvoice) {
      const tax      = Math.round(amountGross * 15 / 115 * 100) / 100;
      const subtotal = Math.round((amountGross - tax) * 100) / 100;
      const dueDate  = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoiceData: Record<string, unknown> = {
        invoice_number:   generateInvoiceNumber(),
        type:             'order',
        reference_id:     orderNumber,
        customer_name:    finalCustomerName,
        customer_email:   finalCustomerEmail,
        items:            [{ description: itemDesc, quantity: 1, unitPrice: amountGross, total: amountGross }],
        subtotal,
        tax_rate:         15,
        tax_amount:       tax,
        total:            amountGross,
        status:           'paid',
        paid_date:        new Date().toISOString(),
        due_date:         dueDate.toISOString(),
        notes:            `PayFast payment ID: ${pfPaymentId}`,
        is_active:        true,
      };
      if (tenantId) invoiceData.tenant_id = tenantId;

      const { error: invErr } = await supabase.from('invoices').insert(invoiceData);
      if (invErr) {
        // Table might not exist yet (42P01) — non-fatal
        console.warn('⚠️  Invoice insert failed (non-fatal):', invErr.code, invErr.message);
      } else {
        console.log(`✅ Invoice created for order ${orderNumber}.`);
      }
    } else {
      console.log('ℹ️  Invoice already exists for', orderNumber);
    }

    // ── 4. Send order confirmation email ────────────────────────────────────
    await sendOrderConfirmationEmail({
      customerEmail: finalCustomerEmail,
      customerName:  finalCustomerName,
      orderNumber,
      total:         amountGross,
      itemDescription: itemDesc,
      payfastId:     pfPaymentId,
    });

    // PayFast expects 200 OK
    return NextResponse.json({ success: true, message: 'Payment processed successfully' });

  } catch (error) {
    console.error('❌ PayFast webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// GET handler for testing
export async function GET() {
  return NextResponse.json({
    message: 'PayFast IPN endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}
