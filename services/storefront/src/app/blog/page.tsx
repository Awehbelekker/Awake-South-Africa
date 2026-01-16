'use client'

import Link from 'next/link'
import Image from 'next/image'
import { AWAKE_IMAGES } from '@/lib/constants'

const blogPosts = [
  {
    id: 'getting-started-efoil',
    title: 'Getting Started with eFoiling: A Complete Beginner\'s Guide',
    excerpt: 'Everything you need to know before your first eFoil session. From choosing the right board to mastering your first flight.',
    image: AWAKE_IMAGES.lifestyle.action1,
    date: '2026-01-10',
    category: 'Guides',
    readTime: '8 min read',
  },
  {
    id: 'ravik-vs-vinga',
    title: 'RÄVIK vs VINGA: Which Awake Board is Right for You?',
    excerpt: 'A detailed comparison of our electric jetboard and eFoil lineups to help you make the perfect choice.',
    image: AWAKE_IMAGES.products.ravikS,
    date: '2026-01-05',
    category: 'Product Reviews',
    readTime: '6 min read',
  },
  {
    id: 'best-spots-cape-town',
    title: 'Top 5 eFoil Spots in Cape Town',
    excerpt: 'Discover the best locations around the Cape for electric water sports, from calm bays to scenic coastal routes.',
    image: AWAKE_IMAGES.lifestyle.sunset,
    date: '2025-12-28',
    category: 'Locations',
    readTime: '5 min read',
  },
  {
    id: 'battery-care-tips',
    title: 'How to Maximize Your Awake Battery Life',
    excerpt: 'Pro tips for charging, storing, and maintaining your Awake battery packs for optimal performance and longevity.',
    image: AWAKE_IMAGES.accessories.battery,
    date: '2025-12-20',
    category: 'Maintenance',
    readTime: '4 min read',
  },
  {
    id: 'brabus-collab',
    title: 'BRABUS x AWAKE: The Ultimate Luxury Jetboard',
    excerpt: 'An exclusive look at the collaboration that brought together Swedish innovation and German luxury engineering.',
    image: AWAKE_IMAGES.products.brabusShadow,
    date: '2025-12-15',
    category: 'News',
    readTime: '5 min read',
  },
  {
    id: 'winter-riding-sa',
    title: 'Winter Riding in South Africa: What You Need to Know',
    excerpt: 'Tips for enjoying your Awake board during the cooler months, including wetsuit recommendations and best spots.',
    image: AWAKE_IMAGES.lifestyle.action2,
    date: '2025-12-10',
    category: 'Guides',
    readTime: '6 min read',
  },
]

const categories = ['All', 'Guides', 'Product Reviews', 'Locations', 'Maintenance', 'News']

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Blog & News</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          Stories, guides, and updates from the world of electric water sports
        </p>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                category === 'All'
                  ? 'bg-accent-primary text-awake-black'
                  : 'bg-awake-gray text-white hover:bg-awake-gray/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        <div className="mb-12">
          <Link href={`/blog/${blogPosts[0].id}`} className="block group">
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src={blogPosts[0].image}
                alt={blogPosts[0].title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-awake-black via-awake-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="inline-block px-3 py-1 bg-accent-primary text-awake-black text-sm font-medium rounded-full mb-4">
                  {blogPosts[0].category}
                </span>
                <h2 className="text-3xl font-bold mb-3 group-hover:text-accent-primary transition-colors">
                  {blogPosts[0].title}
                </h2>
                <p className="text-gray-300 mb-4 max-w-2xl">{blogPosts[0].excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{new Date(blogPosts[0].date).toLocaleDateString('en-ZA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                  <span>•</span>
                  <span>{blogPosts[0].readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Post Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="group bg-awake-gray rounded-xl overflow-hidden hover:ring-2 hover:ring-accent-primary transition-all"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 bg-awake-black text-accent-primary text-xs font-medium rounded-full mb-3">
                  {post.category}
                </span>
                <h3 className="font-bold text-lg mb-2 group-hover:text-accent-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(post.date).toLocaleDateString('en-ZA', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Get the latest news, product updates, and riding tips delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:outline-none focus:border-accent-primary"
            />
            <button
              type="submit"
              className="bg-accent-primary text-awake-black px-6 py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
