'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, FileText, Printer, ChevronDown, ChevronUp } from 'lucide-react'

interface Product { id: string; name: string; price: number; category: string; image: string }
interface LineItem { name: string; price: number; quantity: number }

const FINANCING_OPTIONS = [
  { months: 0, label: 'No financing' },
  { months: 12, label: '12 months' },
  { months: 24, label: '24 months' },
  { months: 36, label: '36 months' },
]

export default function QuotePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<LineItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [financingMonths, setFinancingMonths] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [quoteHtml, setQuoteHtml] = useState('')
  const [summary, setSummary] = useState<any>(null)
  const [showProducts, setShowProducts] = useState(true)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/tenant/products?limit=100')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
  }, [])

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  function addProduct(p: Product) {
    setItems(prev => {
      const existing = prev.find(i => i.name === p.name)
      if (existing) return prev.map(i => i.name === p.name ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { name: p.name, price: p.price, quantity: 1 }]
    })
    setShowProducts(false)
  }

  function addCustomItem() {
    setItems(prev => [...prev, { name: 'Custom Item', price: 0, quantity: 1 }])
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const vat = subtotal * 0.15
  const total = subtotal + vat

  async function generateQuote() {
    if (!items.length) { alert('Add at least one item'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/ai/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer_name: customerName || undefined,
          customer_email: customerEmail || undefined,
          customer_phone: customerPhone || undefined,
          financing_months: financingMonths || undefined,
          notes: notes || undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setQuoteHtml(d.quote_html)
      setSummary(d.summary)
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e: any) {
      alert(`Failed to generate quote: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  function printQuote() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Quote</title></head><body>${quoteHtml}</body></html>`)
    win.document.close()
    win.print()
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(n)

  return (
    <main className="min-h-screen bg-awake-black text-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Get a Quote</h1>
          <p className="text-gray-400">Build a custom quote for boards, equipment, or bulk orders. Financing available.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — builder */}
          <div className="space-y-6">

            {/* Product selector */}
            <div className="bg-awake-gray rounded-xl p-5">
              <button
                onClick={() => setShowProducts(!showProducts)}
                className="w-full flex items-center justify-between text-left font-semibold mb-3"
              >
                <span>Select Products</span>
                {showProducts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showProducts && (
                <>
                  <input
                    type="text"
                    placeholder="Search products…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-awake-black border border-white/10 rounded-lg mb-3 focus:ring-1 focus:ring-accent-primary"
                  />
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                    {filtered.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="flex items-center gap-2 p-2 bg-awake-black border border-white/10 rounded-lg hover:border-accent-primary text-left transition-colors"
                      >
                        {p.image && <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{p.name}</p>
                          <p className="text-xs text-accent-primary">{fmt(p.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Line items */}
            <div className="bg-awake-gray rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Quote Items</h2>
                <button onClick={addCustomItem} className="flex items-center gap-1 text-xs text-accent-primary hover:underline">
                  <Plus className="w-3 h-3" /> Custom item
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">No items yet — select products above</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1 min-w-0">
                        <input
                          value={item.name}
                          onChange={e => updateItem(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm bg-awake-black border border-white/10 rounded focus:ring-1 focus:ring-accent-primary mb-1"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number" min="0" step="0.01"
                            value={item.price}
                            onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-xs bg-awake-black border border-white/10 rounded focus:ring-1 focus:ring-accent-primary"
                            placeholder="Price"
                          />
                          <input
                            type="number" min="1"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-xs bg-awake-black border border-white/10 rounded focus:ring-1 focus:ring-accent-primary"
                            placeholder="Qty"
                          />
                          <span className="text-xs text-gray-400 self-center">{fmt(item.price * item.quantity)}</span>
                        </div>
                      </div>
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                  <div className="flex justify-between text-gray-400"><span>VAT (15%)</span><span>{fmt(vat)}</span></div>
                  <div className="flex justify-between font-bold text-accent-primary text-base"><span>Total</span><span>{fmt(total)}</span></div>
                </div>
              )}
            </div>

            {/* Customer details */}
            <div className="bg-awake-gray rounded-xl p-5 space-y-3">
              <h2 className="font-semibold">Customer Details</h2>
              <input type="text" placeholder="Full name" value={customerName} onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-awake-black border border-white/10 rounded-lg focus:ring-1 focus:ring-accent-primary" />
              <input type="email" placeholder="Email address" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-awake-black border border-white/10 rounded-lg focus:ring-1 focus:ring-accent-primary" />
              <input type="tel" placeholder="Phone number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-awake-black border border-white/10 rounded-lg focus:ring-1 focus:ring-accent-primary" />
            </div>

            {/* Financing */}
            <div className="bg-awake-gray rounded-xl p-5">
              <h2 className="font-semibold mb-3">Financing Option</h2>
              <div className="grid grid-cols-2 gap-2">
                {FINANCING_OPTIONS.map(opt => (
                  <button
                    key={opt.months}
                    onClick={() => setFinancingMonths(opt.months)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      financingMonths === opt.months
                        ? 'bg-accent-primary text-awake-black border-accent-primary'
                        : 'bg-awake-black border-white/10 text-gray-300 hover:border-accent-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-awake-gray rounded-xl p-5">
              <h2 className="font-semibold mb-3">Notes / Special Requirements</h2>
              <textarea
                rows={3}
                placeholder="Delivery requirements, custom configuration, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-awake-black border border-white/10 rounded-lg focus:ring-1 focus:ring-accent-primary resize-none"
              />
            </div>

            <button
              onClick={generateQuote}
              disabled={loading || !items.length}
              className="w-full bg-accent-primary text-awake-black py-4 rounded-xl font-bold text-lg hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              {loading ? 'Generating Quote…' : 'Generate Professional Quote'}
            </button>
          </div>

          {/* Right — preview */}
          <div ref={previewRef}>
            {quoteHtml ? (
              <div className="sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Quote Preview</h2>
                  <button
                    onClick={printQuote}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-awake-black rounded-lg hover:bg-gray-100 font-medium text-sm"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                </div>
                {summary && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-awake-gray rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400">Subtotal</p>
                      <p className="font-bold text-sm">{fmt(summary.subtotal)}</p>
                    </div>
                    <div className="bg-awake-gray rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400">VAT</p>
                      <p className="font-bold text-sm">{fmt(summary.vat)}</p>
                    </div>
                    <div className="bg-accent-primary/20 border border-accent-primary/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="font-bold text-accent-primary text-sm">{fmt(summary.total)}</p>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-xl overflow-hidden shadow-xl">
                  <iframe
                    srcDoc={quoteHtml}
                    className="w-full border-0"
                    style={{ height: '700px' }}
                    title="Quote Preview"
                  />
                </div>
              </div>
            ) : (
              <div className="sticky top-6 bg-awake-gray rounded-xl p-12 text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Quote preview will appear here</p>
                <p className="text-sm mt-2">Add products and click Generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
