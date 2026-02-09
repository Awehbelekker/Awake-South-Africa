/**
 * Structured Data Component
 * Renders JSON-LD structured data for SEO
 */

import { generateJsonLd } from "@/lib/seo/structured-data";

interface StructuredDataProps {
  data: any;
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={generateJsonLd(data)}
    />
  );
}
