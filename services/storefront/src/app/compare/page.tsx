'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AWAKE_IMAGES } from '@/lib/constants'

const products = [
  {
    id: 'ravik-s',
    name: 'RÄVIK S',
    category: 'Jetboard',
    price: 285000,
    image: AWAKE_IMAGES.products.ravikS,
    specs: {
      topSpeed: '57 km/h',
      range: '45 min',
      weight: '35 kg',
      power: '12 kW',
      battery: '2.2 kWh',
      construction: 'Carbon Fiber',
    }
  },
  {
    id: 'ravik-3',
    name: 'RÄVIK 3',
    category: 'Jetboard',
    price: 245000,
    image: AWAKE_IMAGES.products.ravik3,
    specs: {
      topSpeed: '50 km/h',
      range: '40 min',
      weight: '32 kg',
      power: '10 kW',
      battery: '2.0 kWh',
      construction: 'Carbon Composite',
    }
  },
  {
    id: 'vinga-2',
    name: 'VINGA 2',
    category: 'eFoil',
    price: 195000,
    image: AWAKE_IMAGES.products.vinga2,
    specs: {
      topSpeed: '40 km/h',
      range: '90 min',
      weight: '28 kg',
      power: '5 kW',
      battery: '2.2 kWh',
      construction: 'Carbon Fiber',
    }
  },
  {
    id: 'brabus-shadow',
    name: 'BRABUS x AWAKE',
    category: 'Jetboard',
    price: 350000,
    image: AWAKE_IMAGES.products.brabusShadow,
    specs: {
      topSpeed: '60 km/h',
      range: '45 min',
      weight: '36 kg',
      power: '14 kW',
      battery: '2.4 kWh',
      construction: 'Carbon Fiber',
    }
  },
]

const specLabels: Record<string, string> = {
  topSpeed: 'Top Speed',
  range: 'Ride Time',
  weight: 'Weight',
  power: 'Power',
  battery: 'Battery',
  construction: 'Construction',
}

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>(['ravik-s', 'vinga-2'])

  const selectedProducts = products.filter(p => selected.includes(p.id))

  const toggleProduct = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length > 1) {
        setSelected(selected.filter(s => s !== id))
      }
    } else {
      if (selected.length < 3) {
        setSelected([...selected, id])
      }
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Compare Products</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          Select up to 3 products to compare specifications
        </p>

        {/* Product Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => toggleProduct(product.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selected.includes(product.id)
                  ? 'bg-accent-primary text-awake-black'
                  : 'bg-awake-gray text-white hover:bg-awake-gray/80'
              }`}
            >
              {product.name}
            </button>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-4 bg-awake-gray rounded-tl-xl"></th>
                {selectedProducts.map((product) => (
                  <th key={product.id} className="p-4 bg-awake-gray text-center min-w-[200px]">
                    <div className="relative h-32 mb-4">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-400">{product.category}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price Row */}
              <tr className="border-t border-white/10">
                <td className="p-4 font-medium bg-awake-gray/50">Price</td>
                {selectedProducts.map((product) => (
                  <td key={product.id} className="p-4 text-center">
                    <span className="text-xl font-bold text-accent-primary">
                      {formatPrice(product.price)}
                    </span>
                  </td>
                ))}
              </tr>
              
              {/* Spec Rows */}
              {Object.keys(specLabels).map((specKey) => (
                <tr key={specKey} className="border-t border-white/10">
                  <td className="p-4 font-medium bg-awake-gray/50">{specLabels[specKey]}</td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="p-4 text-center text-gray-300">
                      {product.specs[specKey as keyof typeof product.specs]}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Action Row */}
              <tr className="border-t border-white/10">
                <td className="p-4 bg-awake-gray/50 rounded-bl-xl"></td>
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

        {/* Help */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Not sure which board is right for you?
          </p>
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
