'use client'

import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  MessageSquare, ShoppingCart, RefreshCw, Users, Radio,
  Upload, Trash2, Send, CheckCircle, XCircle, Clock, Plus,
  Tag, Phone, ChevronDown, ChevronUp, Image as ImageIcon,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Session {
  id: string; phone: string; state: string; cart: any[]
  last_activity: string; created_at: string
}

interface Contact {
  id: string; phone: string; name: string | null
  tags: string[]; opted_in: boolean; last_messaged_at: string | null
  created_at: string
}

interface Broadcast {
  id: string; name: string; message: string; image_url: string | null
  recipient_count: number; sent_count: number; failed_count: number
  status: string; sent_at: string | null; created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATE_COLOR: Record<string, string> = {
  MENU: 'bg-gray-100 text-gray-600',
  BROWSING: 'bg-blue-100 text-blue-700',
  CART: 'bg-yellow-100 text-yellow-700',
  CHECKOUT: 'bg-orange-100 text-orange-700',
  AWAITING_PAYMENT: 'bg-purple-100 text-purple-700',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  sent:    <CheckCircle className="w-4 h-4 text-green-500" />,
  sending: <Clock className="w-4 h-4 text-yellow-500 animate-spin" />,
  failed:  <XCircle className="w-4 h-4 text-red-500" />,
  draft:   <Clock className="w-4 h-4 text-gray-400" />,
}

function cartTotal(cart: any[]) {
  return (cart || []).reduce((s: number, l: any) => s + (l.price || 0) * (l.quantity || 1), 0)
}

// ── Sessions tab ──────────────────────────────────────────────────────────────

function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/whatsapp/sessions')
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Active customer sessions via WhatsApp commerce bot</p>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['MENU', 'BROWSING', 'CART', 'AWAITING_PAYMENT'] as const).map(s => (
          <div key={s} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500 uppercase">{s.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{sessions.filter(x => x.state === s).length}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Active Sessions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No active sessions yet. When customers message your WhatsApp number they'll appear here.
            </div>
          ) : sessions.map(s => (
            <div key={s.id} className="p-5 flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{s.phone}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATE_COLOR[s.state] || 'bg-gray-100 text-gray-600'}`}>
                    {s.state}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Last active {new Date(s.last_activity).toLocaleString()}</p>
                {(s.cart || []).length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <ShoppingCart className="w-4 h-4" />
                    {s.cart.length} items — R{cartTotal(s.cart).toLocaleString()} in cart
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Contacts tab ──────────────────────────────────────────────────────────────

function ContactsTab() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ phone: '', name: '', tags: '' })
  const [saving, setSaving] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const load = () => {
    setLoading(true)
    const q = search ? `&search=${encodeURIComponent(search)}` : ''
    fetch(`/api/tenant/whatsapp/contacts?opted_in=true${q}`)
      .then(r => r.json())
      .then(d => setContacts(d.contacts || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addContact = async () => {
    if (!form.phone) return
    setSaving(true)
    await fetch('/api/tenant/whatsapp/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: form.phone,
        name: form.name || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }),
    })
    setSaving(false)
    setAdding(false)
    setForm({ phone: '', name: '', tags: '' })
    load()
  }

  const optOut = async (id: string, phone: string) => {
    if (!confirm(`Opt out ${phone}? They won't receive broadcasts.`)) return
    await fetch('/api/tenant/whatsapp/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, opted_in: false }),
    })
    load()
  }

  const bulkImport = async () => {
    if (!importText.trim()) return
    setImporting(true)
    const lines = importText.trim().split('\n').filter(Boolean)
    const contacts = lines.map(line => {
      const [phone, name] = line.split(',').map(s => s.trim())
      return { phone, name: name || undefined }
    })
    const res = await fetch('/api/tenant/whatsapp/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts }),
    })
    const data = await res.json()
    setImporting(false)
    setImportText('')
    setShowImport(false)
    alert(`Imported ${data.imported || 0} contacts`)
    load()
  }

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Search name or number…"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button onClick={load} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            Search
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Bulk import panel */}
      {showImport && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Paste contacts — one per line: <code className="text-xs bg-gray-200 px-1 rounded">phone, name</code></p>
          <p className="text-xs text-gray-500">e.g. 0821234567, Jane Smith</p>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            rows={6}
            placeholder="0821234567, Jane Smith&#10;0731234567, John Doe&#10;0827815979"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-2">
            <button
              onClick={bulkImport}
              disabled={importing || !importText.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
            <button onClick={() => setShowImport(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Add contact form */}
      {adding && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-gray-900">Add Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Phone *</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0737815979"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tags (comma separated)</label>
              <input
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="weekly, vip"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addContact} disabled={saving || !form.phone} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Contact'}
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 uppercase">Total Opted In</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 uppercase">Messaged This Month</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {contacts.filter(c => c.last_messaged_at && new Date(c.last_messaged_at) > new Date(Date.now() - 30 * 86400000)).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs text-gray-500 uppercase">Never Messaged</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{contacts.filter(c => !c.last_messaged_at).length}</p>
        </div>
      </div>

      {/* Contacts list */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Contacts</h2>
          <span className="text-sm text-gray-500">{contacts.length} opted in</span>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No contacts yet. Import your list or add manually.
            </div>
          ) : contacts.map(c => (
            <div key={c.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{c.name || c.phone}</span>
                  {c.name && <span className="text-xs text-gray-400">{c.phone}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {(c.tags || []).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                      <Tag className="w-3 h-3" />{tag}
                    </span>
                  ))}
                  {c.last_messaged_at && (
                    <span className="text-xs text-gray-400">Last messaged {new Date(c.last_messaged_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => optOut(c.id, c.phone)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Opt out"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Broadcast tab ─────────────────────────────────────────────────────────────

function BroadcastTab() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [composing, setComposing] = useState(false)
  const [sending, setSending] = useState(false)
  const [contactCount, setContactCount] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', message: '', imageUrl: '', tagsFilter: '' })
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/tenant/whatsapp/broadcast').then(r => r.json()),
      fetch('/api/tenant/whatsapp/contacts?opted_in=true').then(r => r.json()),
    ]).then(([b, c]) => {
      setBroadcasts(b.broadcasts || [])
      setContactCount(c.count ?? c.contacts?.length ?? 0)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendBroadcast = async () => {
    if (!form.name || !form.message) return
    if (!confirm(`Send to all opted-in contacts${contactCount ? ` (${contactCount})` : ''}?`)) return

    setSending(true)
    setLastResult(null)
    const res = await fetch('/api/tenant/whatsapp/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        message: form.message,
        imageUrl: form.imageUrl || undefined,
        tagsFilter: form.tagsFilter ? form.tagsFilter.split(',').map(t => t.trim()).filter(Boolean) : [],
      }),
    })
    const data = await res.json()
    setSending(false)
    if (res.ok) {
      setLastResult({ sent: data.sent, failed: data.failed })
      setComposing(false)
      setForm({ name: '', message: '', imageUrl: '', tagsFilter: '' })
      load()
    } else {
      alert(`Error: ${data.error}`)
    }
  }

  const charCount = form.message.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {contactCount !== null ? (
              <span><span className="font-semibold text-gray-900">{contactCount}</span> opted-in contacts ready to receive broadcasts</span>
            ) : 'Loading contact count…'}
          </p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          <Send className="w-4 h-4" /> New Broadcast
        </button>
      </div>

      {/* Success banner */}
      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">Broadcast sent!</p>
            <p className="text-sm text-green-700">{lastResult.sent} sent · {lastResult.failed} failed</p>
          </div>
        </div>
      )}

      {/* Compose panel */}
      {composing && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Compose Broadcast</h3>
            <button onClick={() => setComposing(false)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Broadcast name (internal reference) *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Fresh Catch – Week of 30 May"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Message *</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={6}
              placeholder="🎣 Fresh catch this week at Off the Hook!&#10;&#10;✨ Fresh Fish – premium quality & freshness guaranteed&#10;🍗 Pasture-Raised Chickens – GMO free, no hormones&#10;🦐 Frozen Seafood – convenient & delicious&#10;&#10;Orders for Yellowfin Tuna close TODAY at 17:30&#10;🚚 Delivery: To be confirmed&#10;&#10;💙 Thank you for supporting local!"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-400">Emojis welcome — customers see them in WhatsApp</p>
              <p className={`text-xs ${charCount > 1000 ? 'text-red-500' : 'text-gray-400'}`}>{charCount}/1000</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              <span className="inline-flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image URL (optional — paste a public image link)</span>
            </label>
            <input
              value={form.imageUrl}
              onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://yourdomain.com/weekly-catch.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> Tags filter (comma separated — leave blank for all contacts)</span>
            </label>
            <input
              value={form.tagsFilter}
              onChange={e => setForm(f => ({ ...f, tagsFilter: e.target.value }))}
              placeholder="weekly, vip"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Preview */}
          {form.message && (
            <div className="bg-[#ECE5DD] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">WhatsApp preview</p>
              <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm max-w-xs">
                {form.imageUrl && (
                  <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-400 text-xs overflow-hidden">
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover rounded-lg" onError={e => { (e.target as HTMLElement).style.display = 'none' }} />
                  </div>
                )}
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{form.message}</p>
                <p className="text-[10px] text-gray-400 text-right mt-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 items-center pt-2 border-t">
            <button
              onClick={sendBroadcast}
              disabled={sending || !form.name || !form.message}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
            >
              {sending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4" /> Send to {contactCount ?? '?'} contacts</>
              )}
            </button>
            {sending && <p className="text-xs text-gray-500">This may take a minute for large lists…</p>}
          </div>
        </div>
      )}

      {/* Broadcast history */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Broadcast History</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : broadcasts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No broadcasts sent yet. Hit "New Broadcast" to send your first one.
            </div>
          ) : broadcasts.map(b => (
            <div key={b.id} className="px-6 py-4 flex items-start gap-4">
              <div className="mt-0.5 flex-shrink-0">
                {STATUS_ICON[b.status] || <Clock className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-gray-900">{b.name}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    b.status === 'sent' ? 'bg-green-100 text-green-700' :
                    b.status === 'sending' ? 'bg-yellow-100 text-yellow-700' :
                    b.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{b.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{b.message.slice(0, 100)}{b.message.length > 100 ? '…' : ''}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />{b.sent_count} sent</span>
                  {b.failed_count > 0 && <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" />{b.failed_count} failed</span>}
                  <span>{b.recipient_count} recipients</span>
                  {b.sent_at && <span>{new Date(b.sent_at).toLocaleString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'sessions' | 'contacts' | 'broadcast'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'sessions',  label: 'Sessions',  icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'contacts',  label: 'Contacts',  icon: <Users className="w-4 h-4" /> },
  { id: 'broadcast', label: 'Broadcast', icon: <Radio className="w-4 h-4" /> },
]

export default function WhatsAppAdminPage() {
  const [tab, setTab] = useState<Tab>('broadcast')

  return (
    <AdminLayout title="WhatsApp">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-sm text-gray-500 mt-1">Manage contacts, send broadcasts, and monitor commerce sessions</p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab === 'sessions'  && <SessionsTab />}
        {tab === 'contacts'  && <ContactsTab />}
        {tab === 'broadcast' && <BroadcastTab />}
      </div>
    </AdminLayout>
  )
}
