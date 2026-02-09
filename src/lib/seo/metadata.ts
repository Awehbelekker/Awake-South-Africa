/**
 * SEO Metadata Utilities
 * Generates dynamic meta tags for pages and products
 */

import { Metadata } from "next";

export interface ProductSEO {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  brand?: string;
  availability?: "in_stock" | "out_of_stock" | "preorder";
  condition?: "new" | "refurbished" | "used";
}

/**
 * Generate metadata for product pages
 */
export function generateProductMetadata(product: ProductSEO): Metadata {
  const title = `${product.name} | Awake SA`;
  const description = product.description.length > 160 
    ? product.description.substring(0, 157) + "..."
    : product.description;

  const url = `https://awakesa.co.za/products/${product.id}`;
  const imageUrl = product.image.startsWith("http") 
    ? product.image 
    : `https://awakesa.co.za${product.image}`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.category,
      "Awake Boards",
      "electric surfboard",
      "jetboard",
      "eFoil",
      "South Africa",
    ],
    openGraph: {
      type: "website",
      locale: "en_ZA",
      url,
      siteName: "Awake SA",
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

/**
 * Generate metadata for category pages
 */
export function generateCategoryMetadata(
  category: string,
  description?: string
): Metadata {
  const title = `${category} | Awake SA`;
  const desc = description || `Browse our selection of ${category.toLowerCase()} from Awake Boards. Premium electric surfboards and eFoils available in South Africa.`;

  return {
    title,
    description: desc,
    keywords: [category, "Awake Boards", "South Africa", "electric surfboard"],
    openGraph: {
      type: "website",
      locale: "en_ZA",
      url: `https://awakesa.co.za/products?category=${encodeURIComponent(category)}`,
      siteName: "Awake SA",
      title,
      description: desc,
    },
    twitter: {
      card: "summary",
      title,
      description: desc,
    },
  };
}

/**
 * Generate metadata for static pages
 */
export function generatePageMetadata(
  title: string,
  description: string,
  path: string
): Metadata {
  const fullTitle = `${title} | Awake SA`;
  const url = `https://awakesa.co.za${path}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      type: "website",
      locale: "en_ZA",
      url,
      siteName: "Awake SA",
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}
