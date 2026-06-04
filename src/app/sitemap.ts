import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://awakesa.co.za'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/warranty`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]

  // Dynamic product pages from database
  let productPages: MetadataRoute.Sitemap = []
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', 'awake-sa')
        .single()

      if (tenant) {
        const { data: products } = await supabase
          .from('products')
          .select('slug, updated_at')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)

        if (products) {
          productPages = products.map((product) => ({
            url: `${baseUrl}/products/${product.slug}`,
            lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          }))
        }
      }
    }
  } catch {
    // Fall back to static pages only if database is unavailable
  }

  return [...staticPages, ...productPages]
}
