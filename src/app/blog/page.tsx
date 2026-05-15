'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string | null
  author: string
  published_at: string | null
  created_at: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tenant/blog')
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-awake-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Stories & Guides</h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Tips, adventures, and everything electric water sports
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-900 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-800" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-1/3" />
                  <div className="h-6 bg-gray-800 rounded" />
                  <div className="h-4 bg-gray-800 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p className="text-xl">No posts yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-gray-900 rounded-2xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <div className="relative h-48 bg-gray-800">
                  {post.featured_image ? (
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-600 text-4xl">📝</div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.published_at || post.created_at).toLocaleDateString()}
                    </span>
                    <span>{post.author}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-400 text-sm line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-blue-500 text-sm font-medium">
                    Read more <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
