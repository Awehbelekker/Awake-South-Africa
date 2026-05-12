/**
 * Hybrid server-side OCR for invoice scanning.
 * Chain: HunyuanOCR (92% accuracy) → PaddleOCR → LlamaVision (Together AI)
 * Supplements the client-side Tesseract scanner in src/lib/ocr/invoice-scanner.ts
 * with higher-accuracy AI models for structured invoice data extraction.
 */

export const runtime = 'edge'

const INVOICE_PROMPT = `Extract invoice data as JSON with this exact structure:
{
  "supplier": {"name": "", "contact": "", "vat": "", "address": ""},
  "invoiceNumber": "",
  "invoiceDate": "YYYY-MM-DD",
  "items": [{"description": "", "quantity": 0, "unitPrice": 0, "total": 0, "sku": ""}],
  "subtotal": 0,
  "vat": 0,
  "vatRate": 0,
  "total": 0,
  "dueDate": "YYYY-MM-DD",
  "paymentTerms": "",
  "currency": "ZAR"
}
Extract ALL line items. Use null for fields you cannot determine.`

async function tryHunyuan(imageBase64: string, userUrl?: string) {
  const url = userUrl || process.env.HUNYUAN_OCR_URL
  if (!url) return null
  try {
    const res = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tencent/HunyuanOCR',
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          { type: 'text', text: INVOICE_PROMPT },
        ]}],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return { text: data.choices[0].message.content, engine: 'hunyuan', accuracy: 0.92 }
  } catch { return null }
}

async function tryPaddle(imageBase64: string, userUrl?: string) {
  const url = userUrl || process.env.PADDLE_OCR_URL
  if (!url) return null
  try {
    const res = await fetch(`${url}/structure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: imageBase64, fileType: 1 }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const results = data.result?.ocrResults || []
    const avgConf = results.length > 0
      ? results.reduce((s: number, r: { confidence?: number }) => s + (r.confidence || 0), 0) / results.length
      : 0.80
    return {
      text: results.map((r: { text: string }) => r.text).join('\n'),
      structuredData: data.result,
      engine: 'paddle',
      accuracy: avgConf,
    }
  } catch { return null }
}

async function tryLlama(imageBase64: string, userApiKey?: string) {
  const key = userApiKey || process.env.TOGETHER_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        messages: [
          { role: 'system', content: `You are an OCR assistant that extracts structured data from invoices. ${INVOICE_PROMPT}` },
          { role: 'user', content: [
            { type: 'text', text: 'Extract all invoice data from this image.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ]},
        ],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return { text: data.choices[0]?.message?.content || '', engine: 'llama', accuracy: 0.65 }
  } catch { return null }
}

function parseInvoiceJSON(text: string) {
  try {
    const match = text.match(/```json\n([\s\S]*?)\n```/) ||
                  text.match(/```\n([\s\S]*?)\n```/) ||
                  text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[1] || match[0])
  } catch { /* fall through */ }
  return { rawText: text, parseError: true }
}

export async function POST(req: Request) {
  try {
    const { image, imageUrl, forceEngine, userApiKey, hunyuanUrl, paddleUrl } = await req.json()

    let imageBase64 = image as string | undefined
    if (!imageBase64 && imageUrl?.startsWith('data:')) {
      imageBase64 = (imageUrl as string).split(',')[1]
    }

    if (!imageBase64) {
      return Response.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    const engines = forceEngine ? [forceEngine as string] : ['hunyuan', 'paddle', 'llama']
    const attempts: { engine: string; success: boolean; reason?: string }[] = []
    let result: { text?: string; structuredData?: unknown; engine: string; accuracy: number } | null = null

    for (const engine of engines) {
      if (result) break
      if (engine === 'hunyuan') result = await tryHunyuan(imageBase64, hunyuanUrl)
      if (engine === 'paddle')  result = await tryPaddle(imageBase64, paddleUrl)
      if (engine === 'llama')   result = await tryLlama(imageBase64, userApiKey)
      attempts.push({ engine, success: !!result, ...(!result && { reason: 'unavailable or failed' }) })
    }

    if (!result) {
      return Response.json({
        success: false,
        error: 'All OCR engines failed',
        attempts,
        message: 'Unable to scan invoice. Please try again or enter data manually.',
      })
    }

    const invoiceData = result.structuredData || parseInvoiceJSON(result.text || '')
    const confidence = result.accuracy >= 0.85 ? 'high' : result.accuracy >= 0.70 ? 'medium' : 'low'

    return Response.json({
      success: true,
      data: invoiceData,
      source: result.engine,
      accuracy: result.accuracy,
      confidence,
      attempts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'OCR processing failed',
    }, { status: 500 })
  }
}
