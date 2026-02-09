/**
 * SEO Metadata Utilities Tests
 */

import {
  generateProductMetadata,
  generateCategoryMetadata,
  generatePageMetadata,
} from '@/lib/seo/metadata';

describe('SEO Metadata Utilities', () => {
  describe('generateProductMetadata', () => {
    const mockProduct = {
      id: 'test-product',
      name: 'RÄVIK Ultimate',
      description: 'Premium electric surfboard with top speed and performance.',
      price: 389995,
      currency: 'ZAR',
      image: 'https://example.com/image.jpg',
      category: 'Jetboards',
      brand: 'Awake Boards',
      availability: 'in_stock' as const,
    };

    it('generates correct product metadata', () => {
      const metadata = generateProductMetadata(mockProduct);

      expect(metadata.title).toBe('RÄVIK Ultimate | Awake SA');
      expect(metadata.description).toBe('Premium electric surfboard with top speed and performance.');
      expect(metadata.keywords).toContain('RÄVIK Ultimate');
      expect(metadata.keywords).toContain('Jetboards');
    });

    it('truncates long descriptions', () => {
      const longDescription = 'a'.repeat(200);
      const metadata = generateProductMetadata({
        ...mockProduct,
        description: longDescription,
      });

      expect(metadata.description?.length).toBeLessThanOrEqual(160);
      expect(metadata.description).toContain('...');
    });

    it('generates Open Graph tags', () => {
      const metadata = generateProductMetadata(mockProduct);

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBe('RÄVIK Ultimate | Awake SA');
      expect(metadata.openGraph?.images).toHaveLength(1);
      expect(metadata.openGraph?.locale).toBe('en_ZA');
    });

    it('generates Twitter Card tags', () => {
      const metadata = generateProductMetadata(mockProduct);

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBe('RÄVIK Ultimate | Awake SA');
    });

    it('handles relative image URLs', () => {
      const metadata = generateProductMetadata({
        ...mockProduct,
        image: '/images/product.jpg',
      });

      expect(metadata.openGraph?.images?.[0].url).toBe('https://awakesa.co.za/images/product.jpg');
    });
  });

  describe('generateCategoryMetadata', () => {
    it('generates correct category metadata', () => {
      const metadata = generateCategoryMetadata('Jetboards');

      expect(metadata.title).toBe('Jetboards | Awake SA');
      expect(metadata.description).toContain('Jetboards');
      expect(metadata.keywords).toContain('Jetboards');
    });

    it('uses custom description when provided', () => {
      const customDesc = 'Custom category description';
      const metadata = generateCategoryMetadata('Jetboards', customDesc);

      expect(metadata.description).toBe(customDesc);
    });
  });

  describe('generatePageMetadata', () => {
    it('generates correct page metadata', () => {
      const metadata = generatePageMetadata('About Us', 'Learn about Awake SA', '/about');

      expect(metadata.title).toBe('About Us | Awake SA');
      expect(metadata.description).toBe('Learn about Awake SA');
      expect(metadata.alternates?.canonical).toBe('https://awakesa.co.za/about');
    });

    it('generates Open Graph tags', () => {
      const metadata = generatePageMetadata('Contact', 'Get in touch', '/contact');

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.url).toBe('https://awakesa.co.za/contact');
    });
  });
});
