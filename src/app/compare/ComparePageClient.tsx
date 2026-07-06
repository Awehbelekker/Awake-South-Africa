'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getCompareProducts, formatZarPrice } from '@/lib/catalog'
import type { CatalogProduct } from '@/lib/catalog/types'

const specLabels: Record<string, string> = {
  topSpeed: 'Top Speed',
  range: 'Ride Time',
  weight: 'Weight',
  battery: 'Battery',
  construction: 'Construction',
}

const compareProducts = getCompareProducts()

export default function ComparePageClient() {
  const [selected, setSelected] = useState<string[]>([
    'ravik-explore',
    'ravik-adventure',
    'vinga-carve',
  ])

  const selectedProducts = compareProducts.filter((p) => selected.includes(p.id))

  const toggleProduct = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length > 1) setSelected(selected.filter((s) => s !== id))
    } else if (selected.length < 3) {
      setSelected([...selected, id])
    }
  }

  const priceLabel = (p: CatalogProduct) =>
    p.contactForPricing ? p.priceDisplay : formatZarPrice(p.price!)

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Compare Products</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          Select up to 3 products to compare specifications
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {compareProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => toggleProduct(product.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selected.includes(product.id)
                  ? 'bg-accent-primary text-awake-black'
                  : 'bg-awake-gray text-white hover:bg-awake-gray/80'
              }`}
            >
              {product.name.replace(/^Awake /, '')}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-4 bg-awake-gray rounded-tl-xl" />
                {selectedProducts.map((product) => (
                  <th key={product.id} className="p-4 bg-awake-gray text-center min-w-[200px]">
                    <div className="relative h-32 mb-4">
                      {product.image && (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-400">{product.categoryTag}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/10">
                <td className="p-4 font-medium bg-awake-gray/50">Price (illustrative)</td>
                {selectedProducts.map((product) => (
                  <td key={product.id} className="p-4 text-center">
                    <span className="text-xl font-bold text-accent-primary">
                      {priceLabel(product)}
                    </span>
                  </td>
                ))}
              </tr>

              {Object.keys(specLabels).map((specKey) => (
                <tr key={specKey} className="border-t border-white/10">
                  <td className="p-4 font-medium bg-awake-gray/50">{specLabels[specKey]}</td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="p-4 text-center text-gray-300">
                      {product.compareSpecs?.[specKey] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="border-t border-white/10">
                <td className="p-4 bg-awake-gray/50 rounded-bl-xl" />
                {selectedProducts.map((product) => (
                  <td key={product.id} className="p-4 text-center">
                    <Link
                      href={`/products/${product.id}`}
                      className="inline-block bg-accent-primary text-awake-black px-6 py-2 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
                    >
                      View Details
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto">
          Prices are illustrative from EU retail minus 20% distributor discount at the current
          EUR/ZAR rate. Freight, customs, and final margin require landed-cost sign-off before
          checkout.
        </p>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Not sure which board is right for you?</p>
          <Link
            href="/demo"
            className="inline-block bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors"
          >
            Book a Demo to Try Them All
          </Link>
        </div>
      </div>
    </main>
  )
}
