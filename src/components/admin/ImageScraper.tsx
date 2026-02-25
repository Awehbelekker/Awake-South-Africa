'use client'

/**
 * ImageScraper — Scrape product images from awakeboards.com
 * 
 * Provides a UI to check which products need images and
 * trigger server-side scraping that downloads + uploads to Supabase
 */

import { useState } from 'react'
import { useAdminStore } from '@/store/admin'
import { Globe, RefreshCw, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react'

interface ProductStatus {
  id: string
  name: string
  slug: string
  imageCount: number
  hasThumb: boolean
  hasCdnOnly: boolean
  hasSupabase: boolean
  canScrape: boolean
  needsImages: boolean
}

interface ScrapeResult {
  slug: string
  name: string
  status: 'success' | 'failed' | 'skipped'
  imagesFound: number
  imagesUploaded: number
  error?: string
}

export default function ImageScraper() {
  const { settings } = useAdminStore()
  const tenantId = settings.tenantId || '904f8826-d36d-4075-afb7-d178048b6b20'

  const [products, setProducts] = useState<ProductStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [results, setResults] = useState<ScrapeResult[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [progress, setProgress] = useState('')

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tenant/scrape-images?tenant_id=${tenantId}`)
      const data = await res.json()
      if (data.success) {
        setProducts(data.products || [])
      }
    } catch (err: any) {
      console.error('Failed to check image status:', err)
    } finally {
      setLoading(false)
    }
  }

  const startScrape = async (mode: 'missing' | 'all') => {
    setScraping(true)
    setResults([])
    setSummary(null)
    setProgress('Starting scrape...')

    try {
      const res = await fetch('/api/tenant/scrape-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, mode }),
      })

      const data = await res.json()

      if (data.success) {
        setResults(data.results || [])
        setSummary(data.summary)
        setProgress(`Done! ${data.message}`)
        // Refresh status
        checkStatus()
      } else {
        setProgress(`Error: ${data.error}`)
      }
    } catch (err: any) {
      setProgress(`Error: ${err.message}`)
    } finally {
      setScraping(false)
    }
  }

  const needsScraping = products.filter(p => p.needsImages && p.canScrape)
  const withImages = products.filter(p => !p.needsImages)
  const cantScrape = products.filter(p => p.needsImages && !p.canScrape)

  return (
    <div className="space-y-4">
      {/* Check Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          Check Product Images
        </button>

        {products.length > 0 && (
          <span className="text-sm text-gray-600">
            {products.length} products total
          </span>
        )}
      </div>

      {/* Status Summary */}
      {products.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{withImages.length}</div>
            <div className="text-xs text-green-600">Have Images</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">{needsScraping.length}</div>
            <div className="text-xs text-amber-600">Need Scraping</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-700">{cantScrape.length}</div>
            <div className="text-xs text-gray-600">No Source URL</div>
          </div>
        </div>
      )}

      {/* Scrape Buttons */}
      {needsScraping.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={() => startScrape('missing')}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {scraping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Scrape Missing ({needsScraping.length} products)
          </button>

          <button
            onClick={() => startScrape('all')}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Rescrape All
          </button>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className={`p-3 rounded-lg text-sm ${scraping ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
          {progress}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Scrape Results</h4>
          {summary && (
            <div className="text-sm text-gray-600 mb-2">
              {summary.productsSucceeded} succeeded, {summary.productsFailed} failed,{' '}
              {summary.totalImagesUploaded} images uploaded
            </div>
          )}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 p-2 rounded text-sm ${
                  r.status === 'success' ? 'bg-green-50' :
                  r.status === 'failed' ? 'bg-red-50' : 'bg-gray-50'
                }`}
              >
                {r.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : r.status === 'failed' ? (
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <span className="font-medium">{r.name}</span>
                {r.status === 'success' && (
                  <span className="text-green-600">({r.imagesUploaded} images)</span>
                )}
                {r.error && (
                  <span className="text-red-600 text-xs ml-auto">{r.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product List */}
      {products.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            View all products ({products.length})
          </summary>
          <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 text-sm bg-gray-50 rounded">
                {p.hasSupabase ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : p.canScrape ? (
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-gray-400" />
                )}
                <span>{p.name}</span>
                <span className="text-xs text-gray-400">({p.imageCount} images)</span>
                {p.hasCdnOnly && <span className="text-xs text-amber-500">CDN only</span>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
