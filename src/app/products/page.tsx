import Link from 'next/link'
import { getFlatCatalogProducts, formatZarPrice } from '@/lib/catalog'
import ProductsClient from './ProductsClient'

export const metadata = {
  title: 'Awake Jetboards & eFoils | Shop | Awake SA',
  description:
    'Shop Awake RÄVIK jetboards, VINGA eFoils, batteries, and accessories. Official South African distributor.',
}

const HIDDEN_FROM_SHOP = ['Board Only', 'Apparel', 'boards', 'Service']

function filterShopProducts(category?: string) {
  const all = getFlatCatalogProducts().filter(
    (p) => !HIDDEN_FROM_SHOP.includes(p.categoryTag || p.category || '')
  )
  if (!category || category === 'all') return all
  if (category === 'accessories') {
    return all.filter((p) =>
      ['batteries', 'wings', 'parts', 'accessories', 'Bag', 'Safety', 'Storage', 'Electronics'].includes(
        p.categoryTag || p.category || ''
      )
    )
  }
  return all.filter((p) => p.category === category || p.categoryTag === category)
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams?: { category?: string }
}) {
  const category = searchParams?.category ?? 'all'
  const products = filterShopProducts(category)

  return (
    <main className="min-h-screen bg-awake-black text-white">
      <section className="relative pt-28 pb-10 sm:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10 text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4">
            Explore Our
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-cyan-400">
              Collection
            </span>
          </h1>
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Premium electric surfboards, eFoils, and accessories from Awake Sweden.
          </p>
        </div>
      </section>

      {/* Server-rendered catalog for SEO / curl (visually hidden; interactive grid below) */}
      <section className="sr-only" aria-label="Product catalog">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <li key={p.id} className="border border-white/10 rounded-lg p-4 bg-awake-gray/50">
              <h2 className="font-bold text-lg">
                <Link href={`/products/${p.id}`} className="hover:text-accent-primary">
                  {p.name}
                </Link>
              </h2>
              <p className="text-accent-primary font-semibold mt-1">
                {p.contactForPricing ? p.priceDisplay : formatZarPrice(p.price!)}
              </p>
              <p className="text-sm text-gray-400 mt-1">{p.categoryTag}</p>
              {p.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pb-20 max-w-7xl mx-auto">
        <ProductsClient initialProducts={getFlatCatalogProducts()} initialCategory={category} />
      </section>
    </main>
  )
}
