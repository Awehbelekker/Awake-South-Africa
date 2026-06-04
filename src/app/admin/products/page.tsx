'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { useProductsStore, EditableProduct } from '@/store/products'
import { useAdminProducts, useAdminUpdateProduct, useAdminUpdateVariant } from '@/lib/medusa-hooks'
import ProductEditModal from '@/components/admin/ProductEditModal'
import QuickProductCreate from '@/components/admin/QuickProductCreate'
import toast, { Toaster } from 'react-hot-toast'
import { RefreshCw, Database, WifiOff, Trash2, Plus, RotateCcw, Layers, GripVertical, Save } from 'lucide-react'
import Link from 'next/link'
import { PRODUCTS as DEFAULT_PRODUCTS } from '@/lib/constants'

function mapSupabaseProduct(p: any): EditableProduct {
  return {
    id: p.metadata?.localId || p.id,
    _supabaseId: p.id,
    _slug: p.slug,
    name: p.name,
    price: p.price || 0,
    priceExVAT: p.price_ex_vat || Math.round((p.price || 0) / 1.15),
    costEUR: p.cost_eur || 0,
    category: p.category,
    categoryTag: p.category_tag || p.category,
    description: p.description,
    image: p.image || p.images?.[0],
    badge: p.badge,
    battery: p.battery,
    skillLevel: p.skill_level,
    specs: p.specs,
    features: p.features,
    whatsIncluded: p.whats_included,
    inStock: p.in_stock,
    stockQuantity: p.stock_quantity,
    sort_order: p.sort_order,
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
  const [deleting, setDeleting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [sortField, setSortField] = useState<'name' | 'price' | 'category'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Drag-and-drop ordering state
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [displayOrder, setDisplayOrder] = useState<EditableProduct[]>([])
  const [orderChanged, setOrderChanged] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  const { data: medusaData, isLoading, error: medusaError, refetch } = useAdminProducts()
  const updateProductMutation = useAdminUpdateProduct()
  const updateVariantMutation = useAdminUpdateVariant()

  const medusaProducts = medusaData?.products
  const useMedusa = !!(medusaProducts && medusaProducts.length > 0 && !medusaError)

  const [supabaseProducts, setSupabaseProducts] = useState<EditableProduct[]>([])
  const [supabaseAvailable, setSupabaseAvailable] = useState(true)
  const [supabaseLoading, setSupabaseLoading] = useState(false)

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
            autoSyncToSupabase(localProducts)
          }
        })
        .catch(() => setSupabaseAvailable(false))
        .finally(() => setSupabaseLoading(false))
    }
  }, [useMedusa, isLoading])

  // Keep displayOrder in sync with supabaseProducts (already sorted by sort_order from API)
  useEffect(() => {
    if (supabaseProducts.length > 0) {
      setDisplayOrder(supabaseProducts)
      setOrderChanged(false)
    }
  }, [supabaseProducts])

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

  // In Supabase mode: use drag-ordered list (filtered); otherwise use column-sorted list
  const tableProducts = useSupabase
    ? displayOrder.filter(p => filter === 'all' || (p.categoryTag || p.category) === filter)
    : sortedProducts

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

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) setDragOverId(id)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) { setDragOverId(null); return }
    setDisplayOrder(prev => {
      const items = [...prev]
      const from = items.findIndex(p => p.id === dragId)
      const to = items.findIndex(p => p.id === targetId)
      if (from === -1 || to === -1) return prev
      const [moved] = items.splice(from, 1)
      items.splice(to, 0, moved)
      return items
    })
    setOrderChanged(true)
    setDragId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDragId(null)
    setDragOverId(null)
  }

  const saveOrder = async () => {
    setSavingOrder(true)
    try {
      await Promise.all(
        displayOrder.map((product, index) => {
          const supabaseId = (product as any)._supabaseId
          if (!supabaseId) return Promise.resolve()
          return fetch('/api/tenant/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: supabaseId, sort_order: index }),
          })
        })
      )
      setOrderChanged(false)
      toast.success('Display order saved!')
    } catch {
      toast.error('Failed to save order')
    } finally {
      setSavingOrder(false)
    }
  }

  const startEdit = (product: EditableProduct) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const saveToSupabase = async (product: EditableProduct) => {
    const supabaseId = (product as any)._supabaseId

    if (supabaseId) {
      const res = await fetch('/api/tenant/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, id: supabaseId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Save failed')
    } else {
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
        updateLocalProduct(product.id, product)
        toast.success('Product saved!')
      } catch (err) {
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
      try {
        await saveToSupabase(product)
        updateLocalProduct(product.id, product)
        toast.success('Product saved!')
      } catch {
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
        const product = supabaseProducts.find(p => p.id === id)
        const supabaseId = (product as any)?._supabaseId || id
        const res = await fetch(`/api/tenant/products?id=${supabaseId}`, { method: 'DELETE' })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setSupabaseProducts(prev => prev.filter(p => p.id !== id))
      }
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
      selectedIds.forEach(id => deleteLocalProduct(id))
      toast.success(`${selectedIds.size} product(s) deleted`)
      setSelectedIds(new Set())
    } catch (err: any) {
      toast.error('Bulk delete failed: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleResetAndResync = async () => {
    if (!confirm('This will DELETE all products from Supabase and re-sync the canonical 44 products from the catalog. Continue?')) return
    setResetting(true)
    try {
      const delRes = await fetch('/api/tenant/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purgeAll: true }),
      })
      const delData = await delRes.json()
      if (!delData.success) throw new Error(delData.error || 'Purge failed')

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
      ].map(p => ({ ...p, inStock: true, stockQuantity: 5 }))

      const seen = new Set<string>()
      const unique = canonicalProducts.filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })

      const syncRes = await fetch('/api/tenant/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: unique }),
      })
      const syncData = await syncRes.json()
      if (!syncData.success) throw new Error(syncData.error || 'Sync failed')

      toast.success(`Reset complete: ${syncData.synced} canonical products synced to Supabase`)

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
    if (!product.costEUR || !product.priceExVAT) return 'N/A'
    const costZAR = product.costEUR * (settings.exchangeRate || 1)
    const margin = product.priceExVAT > 0 ? ((product.priceExVAT - costZAR) / product.priceExVAT) * 100 : 0
    return isNaN(margin) ? 'N/A' : margin.toFixed(2) + '%'
  }

  const calculateProfit = (product: any) => {
    if (!product.costEUR || !product.priceExVAT) return 'N/A'
    const costZAR = product.costEUR * (settings.exchangeRate || 1)
    const profit = product.priceExVAT - costZAR
    return isNaN(profit) ? 'N/A' : 'R' + Math.round(profit).toLocaleString()
  }

  return (
    <AdminLayout title="Products">
      <Toaster position="top-right" />

      {/* Data Source Indicator + Actions */}
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
          {/* Save Order button — only visible when user has dragged something */}
          {orderChanged && dataSource === 'supabase' && (
            <button
              onClick={saveOrder}
              disabled={savingOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              {savingOrder ? 'Saving...' : 'Save Order'}
            </button>
          )}
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

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center text-blue-700">
          Loading products from Medusa...
        </div>
      )}

      {/* Drag-order hint */}
      {dataSource === 'supabase' && (
        <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <GripVertical className="h-3.5 w-3.5 flex-shrink-0" />
          Drag rows to reorder how products appear in the shop. Click <strong>Save Order</strong> when done.
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
        <div className="flex items-center gap-3 px-4 py-2 mb-2 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-700 font-medium">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
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
              {/* Drag handle column — only in Supabase mode */}
              {useSupabase && (
                <th className="w-8 px-3 py-3" aria-label="Drag to reorder" />
              )}
              <th className="px-4 py-3">
                <input type="checkbox" checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${!useSupabase ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                onClick={!useSupabase ? () => handleSort('name') : undefined}
              >
                <div className="flex items-center gap-2">
                  Product {!useSupabase && <SortIcon field="name" />}
                </div>
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${!useSupabase ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                onClick={!useSupabase ? () => handleSort('category') : undefined}
              >
                <div className="flex items-center gap-2">
                  Category {!useSupabase && <SortIcon field="category" />}
                </div>
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${!useSupabase ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                onClick={!useSupabase ? () => handleSort('price') : undefined}
              >
                <div className="flex items-center gap-2">
                  Price (inc VAT) {!useSupabase && <SortIcon field="price" />}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost EUR</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableProducts.map((product) => (
              <tr
                key={product.id}
                draggable={useSupabase}
                onDragStart={useSupabase ? (e) => handleDragStart(e, product.id) : undefined}
                onDragOver={useSupabase ? (e) => handleDragOver(e, product.id) : undefined}
                onDrop={useSupabase ? (e) => handleDrop(e, product.id) : undefined}
                onDragEnd={useSupabase ? handleDragEnd : undefined}
                className={[
                  selectedIds.has(product.id) ? 'bg-blue-50' : '',
                  dragOverId === product.id && dragId !== product.id ? 'border-t-2 border-blue-500' : '',
                  dragId === product.id ? 'opacity-40' : '',
                  useSupabase ? 'cursor-default' : '',
                ].filter(Boolean).join(' ')}
              >
                {/* Drag handle */}
                {useSupabase && (
                  <td className="px-3 py-4 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing select-none">
                    <GripVertical className="h-4 w-4" />
                  </td>
                )}
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
    </AdminLayout>
  )
}
