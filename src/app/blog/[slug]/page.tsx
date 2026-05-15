'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ArrowLeft, User } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content_html: string
  featured_image: string | null
  author: string
  published_at: string | null
  created_at: string
}

export default function BlogPostPage() {
  const { slug } = useParams() as { slug: string }
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tenant/blog/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.post) setPost(d.post)
        else router.push('/blog')
      })
      .finally(() => setLoading(false))
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-awake-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="min-h-screen bg-awake-black text-white">
      {/* Hero */}
      {post.featured_image && (
        <div className="relative h-72 md:h-96 w-full">
          <Image src={post.featured_image} alt={post.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-awake-black via-awake-black/50 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <h1 className="text-4xl font-bold text-white mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-10 pb-8 border-b border-gray-800">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" /> {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(post.published_at || post.created_at).toLocaleDateString('en-ZA', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
        </div>

        {/* Rendered HTML content */}
        <div
          className="prose prose-invert prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />
      </div>
    </div>
  )
}
