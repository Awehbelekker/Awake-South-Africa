'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { useProductsStore, EditableProduct } from '@/store/products'
import { useAdminProducts, useAdminUpdateProduct, useAdminUpdateVariant } from '@/lib/medusa-hooks'
import ProductEditModal from '@/components/admin/ProductEditModal'
import toast, { Toaster } from 'react-hot-toast'
import { RefreshCw, Database, HardDrive } from 'lucide-react'

export default function AdminProductsPage() {
  const router = useRouter()
  const { isAuthenticated, settings, authMode } = useAdminStore()
  const { products: localProducts, updateProduct: updateLocalProduct } = useProductsStore()
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch products from Medusa Admin API
  const { data: medusaData, isLoading, error: medusaError, refetch } = useAdminProducts()
  const updateProductMutation = useAdminUpdateProduct()
  const updateVariantMutation = useAdminUpdateVariant()

  // Use Medusa products if available, otherwise fallback to Supabase, then local
  const medusaProducts = medusaData?.products
  const useMedusa = medusaProducts && medusaProducts.length > 0 && !medusaError
  const [supabaseProducts, setSupabaseProducts] = useState<EditableProduct[]>([])
  const [supabaseLoading, setSupabaseLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Fetch from Supabase when Medusa unavailable
  useEffect(() => {
    if (!useMedusa && !isLoading) {
      setSupabaseLoading(true)
      fetch('/api/tenant/products')
        .then(r => r.json())
        .then(data => {
          if (data.products?.length > 0) {
            // Map Supabase product shape to EditableProduct
            setSupabaseProducts(data.products.map((p: any) => ({
              id: p.metadata?.localId || p.id,
              name: p.name,
              price: p.price,
              priceExVAT: p.price_ex_vat || Math.round(p.price / 1.15),
              costEUR: p.cost_eur,
              category: p.category,
              categoryTag: p.category_tag || p.category,
              description: p.description,
              image: p.image || p.images?.[0],
              badge: p.badge,
              battery: p.battery,
              skillLevel: p.skill_level,
              specs: p.specs,
              features: p.features,
              inStock: p.in_stock,
              stockQuantity: p.stock_quantity,
            })))
          }
        })
        .catch(() => {})
        .finally(() => setSupabaseLoading(false))
    }
  }, [useMedusa, isLoading])

  const useSupabase = !useMedusa && supabaseProducts.length > 0
  const products: EditableProduct[] = useMedusa ? medusaProducts : useSupabase ? supabaseProducts : localProducts
  const dataSource = useMedusa ? 'medusa' : useSupabase ? 'supabase' : 'local'

  const syncToSupabase = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/tenant/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: localProducts }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Synced ${data.synced} products to Supabase!`)
        // Reload from Supabase
        const r2 = await fetch('/api/tenant/products')
        const d2 = await r2.json()
        if (d2.products?.length > 0) setSupabaseProducts(d2.products.map((p: any) => ({
          id: p.metadata?.localId || p.id, name: p.name, price: p.price,
          priceExVAT: p.price_ex_vat || Math.round(p.price / 1.15),
          costEUR: p.cost_eur, category: p.category, categoryTag: p.category_tag || p.category,
          description: p.description, image: p.image || p.images?.[0], badge: p.badge,
          battery: p.battery, skillLevel: p.skill_level,
          specs: p.specs, features: p.features,
          inStock: p.in_stock, stockQuantity: p.stock_quantity,
        })))
      } else {
        toast.error(`Sync failed: ${data.error}`)
      }
    } catch (e: any) {
      toast.error(`Sync failed: ${e.message}`)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  const filteredProducts = filter === 'all'
    ? products
    : products.filter(p => (p.categoryTag || p.category) === filter)

  const categories = ['all', ...Array.from(new Set(products.map(p => p.categoryTag || p.category)))]

  const startEdit = (product: EditableProduct) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleSave = async (product: EditableProduct) => {
    if (useMedusa) {
      try {
        // Update product title, description, metadata via Medusa Admin API
        await updateProductMutation.mutateAsync({
          id: product.id,
          data: {
            title: product.name,
            description: product.description,
            thumbnail: product.image,
            metadata: {
              costEUR: product.costEUR,
              category: product.category,
              categoryTag: product.categoryTag,
              skillLevel: product.skillLevel,
              battery: product.battery,
              badge: product.badge,
              specs: product.specs,
              features: product.features,
            },
          },
        })

        // Update variant pricing and inventory if we have variant info
        if ((product as any).variantId) {
          await updateVariantMutation.mutateAsync({
            productId: product.id,
            variantId: (product as any).variantId,
            data: {
              prices: [{ amount: Math.round(product.price * 100), currency_code: 'zar' }],
              inventory_quantity: product.stockQuantity,
              metadata: {
                costEUR: product.costEUR,
                priceExVAT: product.priceExVAT,
              },
            },
          })
        }

        toast.success('Product updated in Medusa!')
      } catch (err) {
        console.error('Medusa update failed:', err)
        toast.error('Failed to update in Medusa. Saving locally.')
        updateLocalProduct(product.id, product)
      }
    } else {
      updateLocalProduct(product.id, product)
      toast.success('Product updated locally')
    }

    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const calculateMargin = (product: any) => {
    if (!product.costEUR) return 'N/A'
    const costZAR = product.costEUR * settings.exchangeRate
    const margin = ((product.priceExVAT - costZAR) / product.priceExVAT) * 100
    return margin.toFixed(2) + '%'
  }

  const calculateProfit = (product: any) => {
    if (!product.costEUR) return 'N/A'
    const costZAR = product.costEUR * settings.exchangeRate
    const profit = product.priceExVAT - costZAR
    return 'R' + Math.round(profit).toLocaleString()
  }

  return (
    <AdminLayout title="Products">
      <Toaster position="top-right" />

      {/* Data Source Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          {dataSource === 'medusa' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full">
              <Database className="h-3.5 w-3.5" />
              Medusa API ({products.length} products)
            </span>
          ) : dataSource === 'supabase' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              <Database className="h-3.5 w-3.5" />
              Supabase ({products.length} products)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
              <HardDrive className="h-3.5 w-3.5" />
              Local Storage ({products.length} products)
            </span>
          )}
          {medusaError && (
            <span className="text-xs text-red-500">Medusa unavailable</span>
          )}
          {supabaseLoading && (
            <span className="text-xs text-gray-400">Checking Supabase...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dataSource === 'local' && (
            <button
              onClick={syncToSupabase}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              <Database className={`h-3.5 w-3.5 ${syncing ? 'animate-pulse' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to Supabase'}
            </button>
          )}
          {dataSource === 'medusa' && (
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border rounded-md hover:bg-gray-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && dataSource === 'medusa' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center text-blue-700">
          Loading products from Medusa...
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Category
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Products' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (inc VAT)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost EUR</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4">
                  <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.categoryTag || product.category}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-xs truncate" dangerouslySetInnerHTML={{ __html: product.description || '' }} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">R{product.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.costEUR ? `€${product.costEUR.toLocaleString()}` : 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{calculateMargin(product)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{calculateProfit(product)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.stockQuantity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => startEdit(product)} className="text-blue-600 hover:text-blue-900">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Edit Modal */}
      <ProductEditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={editingProduct}
        onSave={handleSave}
      />
    </AdminLayout>
  )
}
