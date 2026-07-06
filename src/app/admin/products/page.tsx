'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { useProductsStore, EditableProduct } from '@/store/products'
import { useAdminProducts, useAdminUpdateProduct, useAdminUpdateVariant } from '@/lib/medusa-hooks'
import ProductEditModal from '@/components/admin/ProductEditModal'
import BulkEditModal, { BulkEditUpdates } from '@/components/admin/BulkEditModal'
import QuickProductCreate from '@/components/admin/QuickProductCreate'
import toast, { Toaster } from 'react-hot-toast'
import { RefreshCw, Database, WifiOff, Trash2, Plus, RotateCcw, Layers, Pencil } from 'lucide-react'
import Link from 'next/link'
import { PRODUCTS as DEFAULT_PRODUCTS } from '@/lib/constants'
import { fulfillmentLabel, getProductInventory } from '@/lib/inventory'
import { resolveCostEur, resolvePrices, marginOnCost } from '@/lib/product-costs'

function mapSupabaseProduct(p: any): EditableProduct {
  const id = p.metadata?.localId || p.sku || p.slug
  const inv = getProductInventory(id)
  return {
    id: p.metadata?.localId || p.id,
    _supabaseId: p.id,
    _slug: p.slug,
    name: p.name,
    price: p.price || 0,
    priceExVAT: p.price_ex_vat || Math.round((p.price || 0) / 1.15),
    costEUR: p.cost_eur ?? resolveCostEur(id) ?? 0,
    category: p.category,
    categoryTag: p.category_tag || p.category,
    description: p.description,
    image: p.image || p.images?.[0],
    badge: p.badge,
    battery: p.battery,
    skillLevel: p.skill_level,
    specs: p.specs,
    features: p.features,
    whatsIncluded: p.what_is_included,
    inStock: p.in_stock ?? inv.inStock,
    stockQuantity: p.stock_quantity ?? inv.stockQuantity,
    fulfillment: p.metadata?.fulfillment || inv.fulfillment,
    demoUnits: p.metadata?.demoUnits ?? inv.demoUnits,
  } as any
}

export default function AdminProductsPage() {
  const router = useRouter()
  const { isAuthenticated, settings } = useAdminStore()
  const { products: localProducts, updateProduct: updateLocalProduct, deleteProduct: deleteLocalProduct } = useProductsStore()
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [sortField, setSortField] = useState<'name' | 'price' | 'category'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Fetch products from Medusa Admin API
  const { data: medusaData, isLoading, error: medusaError, refetch } = useAdminProducts()
  const updateProductMutation = useAdminUpdateProduct()
  const updateVariantMutation = useAdminUpdateVariant()

  const medusaProducts = medusaData?.products
  const useMedusa = !!(medusaProducts && medusaProducts.length > 0 && !medusaError)

  const [supabaseProducts, setSupabaseProducts] = useState<EditableProduct[]>([])
  const [supabaseAvailable, setSupabaseAvailable] = useState(true)
  const [supabaseLoading, setSupabaseLoading] = useState(false)

  // Load from Supabase whenever Medusa is unavailable
  useEffect(() => {
    if (!useMedusa && !isLoading) {
      setSupabaseLoading(true)
      fetch('/api/tenant/products')
        .then(r => r.json())
        .then(data => {
          setSupabaseAvailable(true)
          if (data.products?.length > 0) {
            setSupabaseProducts(data.products.map(mapSupabaseProduct))
          } else if (localProducts.length > 0) {
            // Supabase reachable but empty — auto-sync local products up
            autoSyncToSupabase(localProducts)
          }
        })
        .catch(() => setSupabaseAvailable(false))
        .finally(() => setSupabaseLoading(false))
    }
  }, [useMedusa, isLoading])

  // Silently push local products to Supabase and switch to Supabase source
  const autoSyncToSupabase = async (products: EditableProduct[]) => {
    try {
      const res = await fetch('/api/tenant/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${data.synced} products synced to Supabase`)
        const r2 = await fetch('/api/tenant/products')
        const d2 = await r2.json()
        if (d2.products?.length > 0) setSupabaseProducts(d2.products.map(mapSupabaseProduct))
      }
    } catch { /* stay on local silently */ }
  }

  const useSupabase = !useMedusa && supabaseAvailable && supabaseProducts.length > 0
  const useLocal = !useMedusa && !useSupabase
  const products: EditableProduct[] = useMedusa ? medusaProducts! : useSupabase ? supabaseProducts : localProducts
  const dataSource = useMedusa ? 'medusa' : useSupabase ? 'supabase' : 'local'

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) router.push('/admin')
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) return null

  const filteredProducts = filter === 'all'
    ? products
    : products.filter(p => (p.categoryTag || p.category) === filter)

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let compareValue = 0;
    if (sortField === 'name') {
      compareValue = a.name.localeCompare(b.name);
    } else if (sortField === 'price') {
      compareValue = a.price - b.price;
    } else if (sortField === 'category') {
      compareValue = (a.categoryTag || a.category).localeCompare(b.categoryTag || b.category);
    }
    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.categoryTag || p.category)))];

  const handleSort = (field: 'name' | 'price' | 'category') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'price' | 'category' }) => {
    if (sortField !== field) return <span className="text-gray-400">⬍</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  const startEdit = (product: EditableProduct) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const saveToSupabase = async (product: EditableProduct) => {
    const supabaseId = (product as any)._supabaseId

    if (supabaseId) {
      // Product came from Supabase — update directly by UUID
      const res = await fetch('/api/tenant/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, id: supabaseId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Save failed')
    } else {
      // Local/new product — upsert by slug
      const res = await fetch('/api/tenant/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: [product] }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Save failed')
    }
    setSupabaseProducts(prev => prev.map(p => p.id === product.id ? product : p))
  }

  const handleSave = async (product: EditableProduct) => {
    if (useMedusa) {
      try {
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
        if ((product as any).variantId) {
          await updateVariantMutation.mutateAsync({
            productId: product.id,
            variantId: (product as any).variantId,
            data: {
              prices: [{ amount: Math.round(product.price * 100), currency_code: 'zar' }],
              inventory_quantity: product.stockQuantity,
              metadata: { costEUR: product.costEUR, priceExVAT: product.priceExVAT },
            },
          })
        }
        // Always update localStorage to persist changes across reloads
        updateLocalProduct(product.id, product)
        toast.success('Product saved!')
      } catch (err) {
        // Medusa failed mid-session — fall through to Supabase
        try {
          await saveToSupabase(product)
          updateLocalProduct(product.id, product)
          toast.success('Product saved to Supabase!')
        } catch {
          updateLocalProduct(product.id, product)
          toast('Saved offline — will sync when connected', { icon: '⚠️' })
        }
      }
    } else {
      // Primary path when Medusa is down: always save to Supabase
      try {
        await saveToSupabase(product)
        // Always update localStorage to persist changes across reloads
        updateLocalProduct(product.id, product)
        toast.success('Product saved!')
      } catch {
        // Supabase also unreachable — offline fallback only
        updateLocalProduct(product.id, product)
        toast('Saved offline — will sync when connected', { icon: '⚠️' })
      }
    }

    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleProductCreated = async () => {
    setIsCreateModalOpen(false)
    // Refresh product list
    if (dataSource === 'supabase') {
      const res = await fetch('/api/tenant/products')
      const data = await res.json()
      if (data.products) {
        setSupabaseProducts(data.products.map(mapSupabaseProduct))
      }
    } else if (dataSource === 'medusa') {
      refetch()
    }
    toast.success('Product created successfully!')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(true)
    try {
      if (dataSource === 'supabase') {
        // Use the real Supabase UUID, not the local slug
        const product = supabaseProducts.find(p => p.id === id)
        const supabaseId = (product as any)?._supabaseId || id
        const res = await fetch(`/api/tenant/products?id=${supabaseId}`, { method: 'DELETE' })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setSupabaseProducts(prev => prev.filter(p => p.id !== id))
      }
      // Always update localStorage to persist deletion across reloads
      deleteLocalProduct(id)
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
      toast.success('Product deleted')
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected product(s)? This cannot be undone.`)) return
    setDeleting(true)
    try {
      if (dataSource === 'supabase') {
        // Map local IDs (slugs) → real Supabase UUIDs before sending
        const supabaseIds = Array.from(selectedIds).map(id => {
          const product = supabaseProducts.find(p => p.id === id)
          return (product as any)?._supabaseId || id
        })
        const res = await fetch('/api/tenant/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: supabaseIds }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setSupabaseProducts(prev => prev.filter(p => !selectedIds.has(p.id)))
      }
      // Always update localStorage to persist deletion across reloads
      selectedIds.forEach(id => deleteLocalProduct(id))
      toast.success(`${selectedIds.size} product(s) deleted`)
      setSelectedIds(new Set())
    } catch (err: any) {
      toast.error('Bulk delete failed: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkEdit = async (updates: BulkEditUpdates) => {
    if (selectedIds.size === 0) return
    setBulkSaving(true)
    try {
      const selectedProducts = products.filter((p) => selectedIds.has(p.id))
      const patchPayload: Record<string, unknown> = { ...updates }
      if (updates.fulfillment === 'preorder') {
        patchPayload.leadTimeWeeks = '4–6'
      }

      if (dataSource === 'supabase') {
        const supabaseIds = selectedProducts.map(
          (p) => (p as any)._supabaseId || p.id
        )
        const res = await fetch('/api/tenant/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bulk: true, ids: supabaseIds, updates: patchPayload }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Bulk update failed')

        setSupabaseProducts((prev) =>
          prev.map((p) => {
            if (!selectedIds.has(p.id)) return p
            return {
              ...p,
              ...(updates.inStock !== undefined && { inStock: updates.inStock }),
              ...(updates.stockQuantity !== undefined && { stockQuantity: updates.stockQuantity }),
              ...(updates.price !== undefined && { price: updates.price }),
              ...(updates.priceExVAT !== undefined && { priceExVAT: updates.priceExVAT }),
              ...(updates.costEUR !== undefined && { costEUR: updates.costEUR }),
              ...(updates.categoryTag !== undefined && {
                categoryTag: updates.categoryTag,
                category: updates.categoryTag,
              }),
              ...(updates.fulfillment !== undefined && { fulfillment: updates.fulfillment }),
            }
          })
        )
      }

      selectedProducts.forEach((p) => {
        updateLocalProduct(p.id, {
          ...(updates.inStock !== undefined && { inStock: updates.inStock }),
          ...(updates.stockQuantity !== undefined && { stockQuantity: updates.stockQuantity }),
          ...(updates.price !== undefined && { price: updates.price }),
          ...(updates.priceExVAT !== undefined && { priceExVAT: updates.priceExVAT }),
          ...(updates.costEUR !== undefined && { costEUR: updates.costEUR }),
          ...(updates.categoryTag !== undefined && {
            categoryTag: updates.categoryTag,
            category: updates.categoryTag,
          }),
          ...(updates.fulfillment !== undefined && { fulfillment: updates.fulfillment }),
        })
      })

      toast.success(`Updated ${selectedIds.size} product(s)`)
      setSelectedIds(new Set())
    } catch (err: any) {
      toast.error('Bulk edit failed: ' + err.message)
      throw err
    } finally {
      setBulkSaving(false)
    }
  }

  const handleResetAndResync = async () => {
    if (!confirm('This will DELETE all products from Supabase and re-sync the canonical 44 products from the catalog. Continue?')) return
    setResetting(true)
    try {
      // Step 1: Hard-delete all products for this tenant
      const delRes = await fetch('/api/tenant/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purgeAll: true }),
      })
      const delData = await delRes.json()
      if (!delData.success) throw new Error(delData.error || 'Purge failed')

      // Step 2: Build canonical product list from constants
      const canonicalProducts = [
        ...DEFAULT_PRODUCTS.jetboards,
        ...DEFAULT_PRODUCTS.limitedEdition,
        ...DEFAULT_PRODUCTS.efoils,
        ...DEFAULT_PRODUCTS.batteries,
        ...DEFAULT_PRODUCTS.boardsOnly,
        ...DEFAULT_PRODUCTS.wings,
        ...DEFAULT_PRODUCTS.bags,
        ...DEFAULT_PRODUCTS.safetyStorage,
        ...DEFAULT_PRODUCTS.electronics,
        ...DEFAULT_PRODUCTS.parts,
        ...DEFAULT_PRODUCTS.apparel,
      ].map(p => {
        const inv = getProductInventory(p.id)
        const official = resolvePrices(p.id)
        return {
          ...p,
          price: official?.retailIncVatZar ?? p.price,
          priceExVAT: official?.retailExVatZar ?? p.priceExVAT,
          costEUR: resolveCostEur(p.id) ?? ('costEUR' in p ? p.costEUR : undefined),
          inStock: inv.inStock,
          stockQuantity: inv.stockQuantity,
        }
      })

      // Deduplicate
      const seen = new Set<string>()
      const unique = canonicalProducts.filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })

      // Step 3: Re-sync canonical products
      const syncRes = await fetch('/api/tenant/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: unique }),
      })
      const syncData = await syncRes.json()
      if (!syncData.success) throw new Error(syncData.error || 'Sync failed')

      toast.success(`Reset complete: ${syncData.synced} canonical products synced to Supabase`)

      // Step 4: Refresh displayed products
      const refreshRes = await fetch('/api/tenant/products')
      const refreshData = await refreshRes.json()
      if (refreshData.products?.length > 0) {
        setSupabaseProducts(refreshData.products.map(mapSupabaseProduct))
      }
    } catch (err: any) {
      toast.error('Reset failed: ' + err.message)
    } finally {
      setResetting(false)
    }
  }

  const calculateMargin = (product: any) => {
    const row = resolvePrices(product.id)
    const landedZar = row?.landedExVatZar ?? (product.costEUR ? product.costEUR * (settings.exchangeRate || 19.85) : 0)
    if (!landedZar || !product.priceExVAT) return 'N/A'
    const markup = marginOnCost(landedZar, product.priceExVAT)
    return isNaN(markup) ? 'N/A' : markup.toFixed(0) + '% on cost'
  }

  const calculateProfit = (product: any) => {
    const row = resolvePrices(product.id)
    const landedZar = row?.landedExVatZar ?? (product.costEUR ? product.costEUR * (settings.exchangeRate || 19.85) : 0)
    if (!landedZar || !product.priceExVAT) return 'N/A'
    const profit = product.priceExVAT - landedZar
    return isNaN(profit) ? 'N/A' : 'R' + Math.round(profit).toLocaleString()
  }

  return (
    <AdminLayout title="Products">
      <Toaster position="top-right" />

      {/* Data Source Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          {dataSource === 'medusa' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full">
              <Database className="h-3.5 w-3.5" />
              Medusa ({products.length} products)
            </span>
          )}
          {dataSource === 'supabase' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              <Database className="h-3.5 w-3.5" />
              Supabase ({products.length} products)
            </span>
          )}
          {dataSource === 'local' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
              <WifiOff className="h-3.5 w-3.5" />
              Offline ({products.length} products) — changes will sync when reconnected
            </span>
          )}
          {supabaseLoading && (
            <span className="text-xs text-gray-400">Connecting to Supabase...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dataSource === 'supabase' && (
            <button
              onClick={handleResetAndResync}
              disabled={resetting}
              title="Purge all Supabase rows and re-sync the 44 canonical products from the catalog"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-orange-700 bg-orange-50 border border-orange-300 hover:bg-orange-100 disabled:opacity-50 rounded-md"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{resetting ? 'Resetting...' : 'Reset & Resync'}</span>
              <span className="sm:hidden">{resetting ? '...' : 'Reset'}</span>
            </button>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
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
      {isLoading && (
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Products' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 mb-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-800 font-medium">{selectedIds.size} selected</span>
          <button
            onClick={() => setIsBulkEditOpen(true)}
            disabled={bulkSaving || deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md"
          >
            <Pencil className="h-3.5 w-3.5" />
            Bulk Edit
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={deleting || bulkSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Product <SortIcon field="name" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                onClick={() => handleSort('category')}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-2">
                  Category <SortIcon field="category" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-2">
                  Price (inc VAT) <SortIcon field="price" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost EUR</th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map((product) => (
              <tr key={product.id} className={selectedIds.has(product.id) ? 'bg-blue-50' : ''}>
                <td className="px-4 py-4">
                  <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                </td>
                <td className="px-6 py-4">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-16 h-16 object-cover rounded border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  {product.badge && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {product.badge}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">{product.categoryTag || product.category}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">R{(product.price || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.costEUR ? `€${product.costEUR.toLocaleString()}` : 'N/A'}</td>

                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.stockQuantity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(product)} className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                    <Link
                      href={`/admin/products/${(product as any)._supabaseId || product.id}/variants`}
                      className="flex items-center gap-1 text-purple-600 hover:text-purple-900 text-sm"
                      title="Manage variants"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      Variants
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Delete product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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

      {/* Quick Product Create Modal */}
      <QuickProductCreate
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProductCreated}
      />

      <BulkEditModal
        isOpen={isBulkEditOpen}
        count={selectedIds.size}
        categories={categories}
        onClose={() => setIsBulkEditOpen(false)}
        onApply={handleBulkEdit}
      />
    </AdminLayout>
  )
}


