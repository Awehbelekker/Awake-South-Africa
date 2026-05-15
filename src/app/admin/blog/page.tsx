'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'
import { Plus, Eye, EyeOff, Trash2, Edit } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  published: boolean
  published_at: string | null
  created_at: string
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/tenant/blog?admin=true')
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const togglePublish = async (p: Post) => {
    const res = await fetch(`/api/tenant/blog/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !p.published }),
    })
    if (res.ok) {
      setPosts(prev => prev.map(x => x.id === p.id ? { ...x, published: !x.published } : x))
      toast.success(p.published ? 'Unpublished' : 'Published')
    }
  }

  const remove = async (p: Post) => {
    if (!confirm(`Delete "${p.title}"?`)) return
    const res = await fetch(`/api/tenant/blog/${p.id}`, { method: 'DELETE' })
    if (res.ok) { setPosts(prev => prev.filter(x => x.id !== p.id)); toast.success('Deleted') }
  }

  return (
    <AdminLayout title="Blog">
      <Toaster />
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your store blog and content</p>
          </div>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> New Post
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No posts yet. Click "New Post" to start your blog.</div>
          ) : posts.map(p => (
            <div key={p.id} className="p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${p.published ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <p className="font-medium text-gray-900 truncate">{p.title}</p>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 truncate">{p.excerpt || 'No excerpt'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  By {p.author} · {new Date(p.created_at).toLocaleDateString()}
                  {p.published && p.published_at && ` · Published ${new Date(p.published_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/blog/${p.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => togglePublish(p)}
                  className={`p-2 rounded-lg ${p.published ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  title={p.published ? 'Unpublish' : 'Publish'}
                >
                  {p.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => remove(p)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
