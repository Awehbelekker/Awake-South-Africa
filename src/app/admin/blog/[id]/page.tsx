'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function BlogPostEditorPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const isNew = id === 'new'

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content_html: '',
    author: 'Admin',
    featured_image: '',
    published: false,
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) return
    fetch(`/api/tenant/blog/${id}?admin=true`)
      .then(r => r.json())
      .then(d => {
        if (d.post) setForm({
          title: d.post.title,
          slug: d.post.slug,
          excerpt: d.post.excerpt || '',
          content_html: d.post.content_html || '',
          author: d.post.author || 'Admin',
          featured_image: d.post.featured_image || '',
          published: d.post.published,
        })
      })
      .finally(() => setLoading(false))
  }, [id, isNew])

  const save = async (publish?: boolean) => {
    if (!form.title) { toast.error('Title is required'); return }
    setSaving(true)

    const body = { ...form }
    if (publish !== undefined) body.published = publish

    try {
      const res = isNew
        ? await fetch('/api/tenant/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch(`/api/tenant/blog/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(isNew ? 'Post created' : 'Saved')
      if (isNew && data.post?.id) router.push(`/admin/blog/${data.post.id}`)
      else if (publish !== undefined) setForm(f => ({ ...f, published: publish }))
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title={isNew ? 'New Post' : 'Edit Post'}>
      <Toaster />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{isNew ? 'New Post' : 'Edit Post'}</h1>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={e => {
                    const t = e.target.value
                    setForm(f => ({
                      ...f,
                      title: t,
                      slug: f.slug || t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    }))
                  }}
                  placeholder="Post title"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    value={form.author}
                    onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  rows={2}
                  placeholder="Short description shown in post listings…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                <input
                  value={form.featured_image}
                  onChange={e => setForm(f => ({ ...f, featured_image: e.target.value }))}
                  placeholder="https://…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content (HTML)</label>
              <textarea
                value={form.content_html}
                onChange={e => setForm(f => ({ ...f, content_html: e.target.value }))}
                rows={20}
                placeholder="<p>Write your post content here…</p>"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-y"
              />
              <p className="text-xs text-gray-400 mt-2">Tip: Use standard HTML tags — &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;img&gt;, &lt;a&gt;.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => save()}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                onClick={() => save(!form.published)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {form.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {form.published ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
