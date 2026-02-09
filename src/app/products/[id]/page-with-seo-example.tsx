/**
 * Product Page with SEO Enhancement Example
 * This demonstrates how to add SEO metadata and structured data to product pages
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import StructuredData from "@/components/StructuredData";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo/structured-data";

// This would typically fetch from your API or database
async function getProduct(id: string) {
  // For demonstration - in production, fetch from your API
  // const product = await fetch(`/api/products/${id}`).then(res => res.json());
  return null; // Return null to use client-side fetching
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const productId = params.id;
  
  // Try to fetch product for metadata (optional - can fall back to client-side)
  const product = await getProduct(productId);

  if (product) {
    const title = `${product.name} | Awake SA`;
    const description = product.description.substring(0, 160);
    const url = `https://awakesa.co.za/products/${productId}`;

    return {
      title,
      description,
      keywords: [product.name, product.category, "Awake Boards", "electric surfboard", "South Africa"],
      openGraph: {
        type: "website",
        locale: "en_ZA",
        url,
        siteName: "Awake SA",
        title,
        description,
        images: [{
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.name,
        }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [product.image],
      },
      alternates: {
        canonical: url,
      },
    };
  }

  // Fallback metadata
  return {
    title: "Product Details",
    description: "View product details and specifications",
  };
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  // This is a server component wrapper that handles SEO
  // The actual interactive product page is in ProductDetailClient
  
  return (
    <>
      {/* Client component handles the interactive UI */}
      <ProductDetailClient productId={params.id} />
    </>
  );
}
