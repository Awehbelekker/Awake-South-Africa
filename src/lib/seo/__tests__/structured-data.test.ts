/**
 * Schema.org Structured Data Tests
 */

import {
  generateProductSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo/structured-data';

describe('Structured Data Utilities', () => {
  describe('generateProductSchema', () => {
    const mockProduct = {
      id: 'test-product',
      name: 'RÄVIK Ultimate',
      description: 'Premium electric surfboard',
      price: 389995,
      priceExVat: 339126,
      currency: 'ZAR',
      image: 'https://example.com/image.jpg',
      category: 'Jetboards',
      brand: 'Awake Boards',
      sku: 'AWK-RAVIK-ULT',
      availability: 'in_stock' as const,
      condition: 'new' as const,
      rating: 4.8,
      reviewCount: 24,
    };

    it('generates valid Product schema', () => {
      const schema = generateProductSchema(mockProduct);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('RÄVIK Ultimate');
      expect(schema.sku).toBe('AWK-RAVIK-ULT');
    });

    it('includes brand information', () => {
      const schema = generateProductSchema(mockProduct);

      expect(schema.brand).toBeDefined();
      expect(schema.brand['@type']).toBe('Brand');
      expect(schema.brand.name).toBe('Awake Boards');
    });

    it('includes offer information', () => {
      const schema = generateProductSchema(mockProduct);

      expect(schema.offers).toBeDefined();
      expect(schema.offers.priceCurrency).toBe('ZAR');
      expect(schema.offers.price).toBe('389995.00');
      expect(schema.offers.availability).toBe('https://schema.org/InStock');
    });

    it('includes rating when available', () => {
      const schema = generateProductSchema(mockProduct);

      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating.ratingValue).toBe('4.8');
      expect(schema.aggregateRating.reviewCount).toBe('24');
    });

    it('omits rating when not available', () => {
      const productWithoutRating = { ...mockProduct, rating: undefined, reviewCount: undefined };
      const schema = generateProductSchema(productWithoutRating);

      expect(schema.aggregateRating).toBeUndefined();
    });

    it('handles relative image URLs', () => {
      const schema = generateProductSchema({
        ...mockProduct,
        image: '/images/product.jpg',
      });

      expect(schema.image).toBe('https://awakesa.co.za/images/product.jpg');
    });
  });

  describe('generateOrganizationSchema', () => {
    it('generates valid Organization schema', () => {
      const schema = generateOrganizationSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Awake SA');
      expect(schema.url).toBe('https://awakesa.co.za');
    });

    it('includes contact information', () => {
      const schema = generateOrganizationSchema();

      expect(schema.contactPoint).toBeDefined();
      expect(schema.contactPoint['@type']).toBe('ContactPoint');
      expect(schema.contactPoint.email).toBe('info@awakesa.co.za');
    });

    it('includes address information', () => {
      const schema = generateOrganizationSchema();

      expect(schema.address).toBeDefined();
      expect(schema.address.addressCountry).toBe('ZA');
    });
  });

  describe('generateWebsiteSchema', () => {
    it('generates valid WebSite schema', () => {
      const schema = generateWebsiteSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('Awake SA');
      expect(schema.url).toBe('https://awakesa.co.za');
    });

    it('includes search action', () => {
      const schema = generateWebsiteSchema();

      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction['@type']).toBe('SearchAction');
      expect(schema.potentialAction.target.urlTemplate).toContain('search_term_string');
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('generates valid BreadcrumbList schema', () => {
      const items = [
        { name: 'Home', url: 'https://awakesa.co.za' },
        { name: 'Products', url: 'https://awakesa.co.za/products' },
        { name: 'RÄVIK Ultimate', url: 'https://awakesa.co.za/products/ravik-ultimate' },
      ];

      const schema = generateBreadcrumbSchema(items);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
    });

    it('correctly numbers breadcrumb positions', () => {
      const items = [
        { name: 'Home', url: 'https://awakesa.co.za' },
        { name: 'Products', url: 'https://awakesa.co.za/products' },
      ];

      const schema = generateBreadcrumbSchema(items);

      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[1].position).toBe(2);
    });
  });
});
