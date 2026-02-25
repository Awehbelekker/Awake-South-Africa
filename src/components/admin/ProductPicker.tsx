'use client'

import { useState, useMemo } from 'react'
import { useProductsStore } from '@/store/products'
import { Search, Package, X, Check } from 'lucide-react'

interface ProductPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (product: {
    description: string
    quantity: number
    unitPrice: number
    total: number
  }) => void
}

export default function ProductPicker({ isOpen, onClose, onSelect }: ProductPickerProps) {
  const { products } = useProductsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.inStock || p.stockQuantity > 0)
      .filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [products, searchQuery])

  const handleSelect = () => {
    if (!selectedProduct) return

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    onSelect({
      description: product.name,
      quantity,
      unitPrice: product.priceExVAT || product.price / 1.15,
      total: (product.priceExVAT || product.price / 1.15) * quantity,
    })

    // Reset and close
    setSelectedProduct(null)
    setQuantity(1)
    setSearchQuery('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Select Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, category, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              autoFocus
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    selectedProduct === product.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Product Image */}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{product.name}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="capitalize">{product.category}</span>
                      <span>•</span>
                      <span className="font-medium text-gray-900">
                        R{(product.priceExVAT || product.price / 1.15).toFixed(2)} (ex VAT)
                      </span>
                    </div>
                    {product.stockQuantity !== undefined && (
                      <div className="text-xs text-gray-500">
                        Stock: {product.stockQuantity} available
                      </div>
                    )}
                  </div>

                  {/* Selected Check */}
                  {selectedProduct === product.id && (
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quantity & Actions */}
        {selectedProduct && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-center text-gray-900 bg-white"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add to Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
