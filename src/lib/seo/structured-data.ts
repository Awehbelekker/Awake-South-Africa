/**
 * Schema.org Structured Data Utilities
 * Generates JSON-LD structured data for SEO
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceExVat: number;
  currency: string;
  image: string;
  category: string;
  brand?: string;
  sku?: string;
  availability?: "in_stock" | "out_of_stock" | "preorder";
  condition?: "new" | "refurbished" | "used";
  rating?: number;
  reviewCount?: number;
}

/**
 * Generate Product Schema.org structured data
 */
export function generateProductSchema(product: Product) {
  const availabilityMap = {
    in_stock: "https://schema.org/InStock",
    out_of_stock: "https://schema.org/OutOfStock",
    preorder: "https://schema.org/PreOrder",
  };

  const conditionMap = {
    new: "https://schema.org/NewCondition",
    refurbished: "https://schema.org/RefurbishedCondition",
    used: "https://schema.org/UsedCondition",
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image.startsWith("http") 
      ? product.image 
      : `https://awakesa.co.za${product.image}`,
    sku: product.sku || product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || "Awake Boards",
    },
    offers: {
      "@type": "Offer",
      url: `https://awakesa.co.za/products/${product.id}`,
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      availability: availabilityMap[product.availability || "in_stock"],
      itemCondition: conditionMap[product.condition || "new"],
      seller: {
        "@type": "Organization",
        name: "Awake SA",
      },
    },
  } as any;

  // Add aggregateRating if available
  if (product.rating && product.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating.toString(),
      reviewCount: product.reviewCount.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  return schema;
}

/**
 * Generate Organization Schema.org structured data
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Awake SA",
    description: "Official Awake Boards distributor for South Africa. Premium RÄVIK Jetboards and VINGA eFoils.",
    url: "https://awakesa.co.za",
    logo: "https://awakesa.co.za/images/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "info@awakesa.co.za",
      availableLanguage: ["English"],
    },
    sameAs: [
      "https://www.facebook.com/awakesa",
      "https://www.instagram.com/awakesa",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "ZA",
      addressRegion: "South Africa",
    },
  };
}

/**
 * Generate BreadcrumbList Schema.org structured data
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate WebSite Schema.org structured data
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Awake SA",
    description: "Official Awake Boards distributor for South Africa",
    url: "https://awakesa.co.za",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://awakesa.co.za/products?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Convert structured data to JSON-LD script tag
 */
export function generateJsonLd(data: any) {
  return {
    __html: JSON.stringify(data),
  };
}
