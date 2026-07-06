import ComparePageClient from './ComparePageClient'
import { getCompareProducts, formatZarPrice } from '@/lib/catalog'

export const metadata = {
  title: 'Compare Awake Jetboards & eFoils | Awake SA',
  description: 'Compare RÄVIK jetboards and VINGA eFoils — specs and illustrative South African pricing.',
}

/** Server-rendered summary for SEO / no-JS clients */
export default function ComparePage() {
  const products = getCompareProducts()

  return (
    <>
      <noscript>
        <div className="bg-awake-black text-white p-8">
          <h1>Compare Awake Products</h1>
          <ul>
            {products.map((p) => (
              <li key={p.id}>
                {p.name} — {p.contactForPricing ? p.priceDisplay : formatZarPrice(p.price!)}
              </li>
            ))}
          </ul>
        </div>
      </noscript>
      <ComparePageClient />
    </>
  )
}
