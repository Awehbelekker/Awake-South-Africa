import crypto from 'crypto';

export interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  email_confirmation?: '1' | '0';
  confirmation_address?: string;
}

export function generatePayFastSignature(
  data: Record<string, string>,
  passPhrase: string = ''
): string {
  // Create parameter string
  let pfOutput = '';
  const sortedKeys = Object.keys(data).sort();
  
  for (const key of sortedKeys) {
    if (data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);
  
  // Add passphrase if provided
  if (passPhrase) {
    pfOutput += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`;
  }

  // Generate signature
  return crypto.createHash('md5').update(pfOutput).digest('hex');
}

export function getPayFastUrl(mode: 'live' | 'sandbox' = 'live'): string {
  return mode === 'live'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';
}

export function createPayFastPayment(
  amount: number,
  itemName: string,
  itemDescription: string,
  paymentId: string,
  userEmail: string,
  userName: string
): { url: string; data: Record<string, string> } {
  const merchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID!;
  const merchantKey = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY!;
  const passPhrase = process.env.PAYFAST_PASSPHRASE!;
  const mode = (process.env.NEXT_PUBLIC_PAYFAST_MODE as 'live' | 'sandbox') || 'live';

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://awake-south-africa.vercel.app';

  const data: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${baseUrl}/payment/success`,
    cancel_url: `${baseUrl}/payment/cancel`,
    notify_url: `${baseUrl}/api/payfast/notify`,
    name_first: userName,
    email_address: userEmail,
    m_payment_id: paymentId,
    amount: amount.toFixed(2),
    item_name: itemName,
    item_description: itemDescription,
    email_confirmation: '1',
    confirmation_address: userEmail,
  };

  // Generate signature
  const signature = generatePayFastSignature(data, passPhrase);
  data.signature = signature;

  return {
    url: getPayFastUrl(mode),
    data,
  };
}
