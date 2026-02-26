import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

interface EmailInvoiceRequest {
  invoiceNumber: string
  customerName: string
  customerEmail: string
  invoiceDate: string
  dueDate: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
  storeName: string
  storeEmail: string
  // Invoice settings
  logo?: string
  logoPosition?: 'left' | 'center' | 'right'
  theme?: 'professional' | 'modern' | 'minimal' | 'bold'
  showVAT?: boolean
  showTaxNumber?: boolean
  taxNumber?: string
  showBankDetails?: boolean
  bankName?: string
  bankAccountNumber?: string
  bankBranchCode?: string
  footerText?: string
  terms?: string
  showLineNumbers?: boolean
  currencySymbol?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailInvoiceRequest = await request.json()
    const { 
      invoiceNumber, 
      customerName, 
      customerEmail, 
      invoiceDate,
      dueDate,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes,
      storeName, 
      storeEmail,
      // Settings
      logo,
      logoPosition = 'left',
      theme = 'professional',
      showVAT = true,
      showTaxNumber = false,
      taxNumber,
      showBankDetails = false,
      bankName,
      bankAccountNumber,
      bankBranchCode,
      footerText,
      terms,
      showLineNumbers = false,
      currencySymbol = 'R'
    } = body

    // Validate required fields
    if (!customerEmail || !invoiceNumber || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Theme colors
    const themeColors = {
      professional: { primary: '#1e40af', border: '#1e40af' },
      modern: { primary: '#9333ea', border: '#9333ea' },
      minimal: { primary: '#111827', border: '#9ca3af' },
      bold: { primary: '#dc2626', border: '#dc2626' }
    }
    const colors = themeColors[theme]

    // Generate invoice HTML
    const invoiceHtml = `
      <div style="max-width: 800px; margin: 0 auto; padding: 40px; background-color: white;">
        ${logo ? `
          <div style="text-align: ${logoPosition}; margin-bottom: 20px;">
            <img src="${logo}" alt="Logo" style="height: 60px;" />
          </div>
        ` : ''}
        
        <div style="border-bottom: 2px solid ${colors.border}; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: ${colors.primary}; margin: 0 0 10px 0; font-size: 32px;">INVOICE</h1>
          <div style="color: #666;">
            <p style="margin: 5px 0; font-weight: 600;">${storeName}</p>
            <p style="margin: 5px 0;">Email: ${storeEmail}</p>
            ${showTaxNumber && taxNumber ? `<p style="margin: 5px 0;">VAT Number: ${taxNumber}</p>` : ''}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Bill To:</p>
            <p style="margin: 5px 0; font-weight: 600;">${customerName}</p>
            <p style="margin: 5px 0; color: #666;">${customerEmail}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 5px 0;"><span style="color: #666;">Invoice #:</span> <strong>${invoiceNumber}</strong></p>
            <p style="margin: 5px 0;"><span style="color: #666;">Date:</span> ${invoiceDate}</p>
            <p style="margin: 5px 0;"><span style="color: #666;">Due Date:</span> ${dueDate}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="border-bottom: 2px solid ${colors.border};">
              ${showLineNumbers ? `<th style="padding: 12px 8px; text-align: left; color: #666; font-size: 14px;">#</th>` : ''}
              <th style="padding: 12px 8px; text-align: left; color: #666; font-size: 14px;">Description</th>
              <th style="padding: 12px 8px; text-align: center; color: #666; font-size: 14px;">Qty</th>
              <th style="padding: 12px 8px; text-align: right; color: #666; font-size: 14px;">Unit Price</th>
              <th style="padding: 12px 8px; text-align: right; color: #666; font-size: 14px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                ${showLineNumbers ? `<td style="padding: 12px 8px; color: #999;">${index + 1}</td>` : ''}
                <td style="padding: 12px 8px;">${item.description}</td>
                <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px 8px; text-align: right;">${currencySymbol}${item.unitPrice.toFixed(2)}</td>
                <td style="padding: 12px 8px; text-align: right;">${currencySymbol}${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: right; margin-bottom: 30px;">
          <div style="display: inline-block; min-width: 300px;">
            <div style="padding: 8px 0; display: flex; justify-content: space-between;">
              <span style="color: #666;">Subtotal:</span>
              <span>${currencySymbol}${subtotal.toFixed(2)}</span>
            </div>
            ${showVAT ? `
              <div style="padding: 8px 0; display: flex; justify-content: space-between;">
                <span style="color: #666;">VAT (${(taxRate * 100).toFixed(0)}%):</span>
                <span>${currencySymbol}${taxAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div style="padding: 12px 0; border-top: 2px solid ${colors.border}; display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
              <span>Total:</span>
              <span>${currencySymbol}${total.toFixed(2)}</span>
            </div>
            ${!showVAT ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">Prices exclude VAT</p>` : ''}
          </div>
        </div>

        ${showBankDetails && bankName ? `
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">Banking Details</h4>
            <p style="margin: 5px 0; font-size: 13px; color: #666;"><strong>Bank:</strong> ${bankName}</p>
            ${bankAccountNumber ? `<p style="margin: 5px 0; font-size: 13px; color: #666;"><strong>Account Number:</strong> ${bankAccountNumber}</p>` : ''}
            ${bankBranchCode ? `<p style="margin: 5px 0; font-size: 13px; color: #666;"><strong>Branch Code:</strong> ${bankBranchCode}</p>` : ''}
          </div>
        ` : ''}

        ${notes ? `
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Notes:</h4>
            <p style="margin: 0; font-size: 13px; color: #666;">${notes}</p>
          </div>
        ` : ''}

        ${terms ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">Terms & Conditions</h4>
            <p style="margin: 0; font-size: 12px; color: #666; white-space: pre-wrap;">${terms}</p>
          </div>
        ` : ''}

        ${footerText ? `
          <div style="text-align: center; margin-top: 30px;">
            <p style="margin: 0; font-size: 12px; color: #999;">${footerText}</p>
          </div>
        ` : ''}
      </div>
    `

    // Create transporter (configure with your SMTP settings)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Email options
    const mailOptions = {
      from: `${storeName} <${storeEmail || process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Invoice ${invoiceNumber} from ${storeName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice ${invoiceNumber}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="background-color: #3b82f6; padding: 20px; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Invoice from ${storeName}</h1>
              </div>
              <div style="padding: 20px;">
                <p style="margin: 0 0 15px 0; color: #333;">Hi ${customerName},</p>
                <p style="margin: 0 0 15px 0; color: #666;">
                  Thank you for your business. Please find your invoice ${invoiceNumber} attached below.
                </p>
                <div style="margin: 20px 0;">
                  ${invoiceHtml}
                </div>
                <p style="margin: 20px 0 15px 0; color: #666;">
                  If you have any questions about this invoice, please contact us.
                </p>
                <p style="margin: 0; color: #333;">
                  Best regards,<br>
                  ${storeName}
                </p>
              </div>
              <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  This is an automated email. Please do not reply directly to this message.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    }

    // Send email
    try {
      await transporter.sendMail(mailOptions)
      
      return NextResponse.json({
        success: true,
        message: `Invoice sent to ${customerEmail}`,
      })
    } catch (emailError: any) {
      console.error('Email send error:', emailError)
      
      // Return specific error message
      if (emailError.code === 'EAUTH') {
        return NextResponse.json(
          { error: 'Email authentication failed. Please check SMTP credentials.' },
          { status: 500 }
        )
      } else if (emailError.code === 'ECONNECTION') {
        return NextResponse.json(
          { error: 'Could not connect to email server. Please check SMTP settings.' },
          { status: 500 }
        )
      } else {
        return NextResponse.json(
          { error: `Failed to send email: ${emailError.message}` },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Invoice email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invoice email' },
      { status: 500 }
    )
  }
}
