'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { Check, X, ExternalLink, Video, Image as ImageIcon, Clock } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Upload {
  id: string
  customer_name: string
  customer_email: string | null
  caption: string | null
  file_url: string
  file_type: 'image' | 'video'
  file_size: number
  status: 'pending' | 'approved' | 'rejected'
  product_id: string | null
  created_at: string
}

export default function AdminUploadsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAdminStore()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  useEffect(() => {
    if (!isAuthenticated) router.push('/admin')
    else loadUploads()
  }, [isAuthenticated, filter])

  async function loadUploads() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tenant/customer-uploads?status=${filter}`)
      const d = await res.json()
      setUploads(d.uploads || [])
    } catch {
      toast.error('Failed to load uploads')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch('/api/tenant/customer-uploads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(status === 'approved' ? 'Approved!' : 'Rejected')
      setUploads(prev => prev.filter(u => u.id !== id))
    } catch {
      toast.error('Update failed')
    }
  }

  async function copyToMediaLibrary(upload: Upload) {
    toast.success('URL copied — paste it into a product\'s media section')
    await navigator.clipboard.writeText(upload.file_url)
  }

  const fmt = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
  const tabs: Array<typeof filter> = ['pending', 'approved', 'rejected', 'all']

  return (
    <AdminLayout title="Customer Uploads">
      <Toaster position="top-right" />

      {/* Stats + share link */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-blue-900">Customer Upload Page</p>
            <p className="text-sm text-blue-700">Share this link so customers can submit photos & videos from their phone:</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-blue-800 font-mono">
              awakesa.co.za/upload
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText('https://awakesa.co.za/upload'); toast.success('Copied!') }}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${filter === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : uploads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No {filter === 'all' ? '' : filter} uploads yet</p>
          {filter === 'pending' && <p className="text-sm mt-1">Share the upload link with customers to get content rolling in</p>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploads.map(u => (
            <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Media preview */}
              <div className="relative bg-gray-100 aspect-video">
                {u.file_type === 'image' ? (
                  <img src={u.file_url} alt={u.caption || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Video className="w-10 h-10 text-gray-400" />
                    <span className="text-xs text-gray-500">Video — {fmt(u.file_size)}</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    u.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    u.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>{u.status}</span>
                </div>
                <a href={u.file_url} target="_blank" rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-900 text-sm">{u.customer_name}</p>
                  <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                    {u.file_type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    {fmt(u.file_size)}
                  </span>
                </div>
                {u.customer_email && <p className="text-xs text-gray-500 mb-1">{u.customer_email}</p>}
                {u.caption && <p className="text-xs text-gray-600 italic mb-2">"{u.caption}"</p>}
                <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>

              {/* Actions */}
              <div className="px-3 pb-3 flex gap-2">
                {u.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(u.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => updateStatus(u.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-lg hover:bg-red-200">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                {u.status === 'approved' && (
                  <button onClick={() => copyToMediaLibrary(u)}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                    Copy URL → Add to Product
                  </button>
                )}
                {u.status === 'rejected' && (
                  <button onClick={() => updateStatus(u.id, 'approved')}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">
                    Re-approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
