/**
 * Sitemap Generation Utility
 * Generates dynamic sitemaps for SEO
 */

import { ProductSEO } from "./metadata";

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Generate sitemap entries for static pages
 */
export function getStaticPages(): SitemapEntry[] {
  const baseUrl = "https://awakesa.co.za";
  const staticPages = [
    { path: "/", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/support", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/shipping", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/warranty", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
  ];

  return staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

/**
 * Generate sitemap entries for products
 */
export function getProductPages(products: ProductSEO[]): SitemapEntry[] {
  const baseUrl = "https://awakesa.co.za";

  return products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}

/**
 * Generate sitemap entries for categories
 */
export function getCategoryPages(categories: string[]): SitemapEntry[] {
  const baseUrl = "https://awakesa.co.za";

  return categories.map((category) => ({
    url: `${baseUrl}/products?category=${encodeURIComponent(category)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
}

/**
 * Generate complete sitemap
 */
export function generateSitemap(
  products: ProductSEO[],
  categories: string[]
): SitemapEntry[] {
  return [
    ...getStaticPages(),
    ...getProductPages(products),
    ...getCategoryPages(categories),
  ];
}

/**
 * Convert sitemap entries to XML format
 */
export function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    ${entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : ""}
    ${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ""}
    ${entry.priority !== undefined ? `<priority>${entry.priority.toFixed(1)}</priority>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;

  return xml;
}
