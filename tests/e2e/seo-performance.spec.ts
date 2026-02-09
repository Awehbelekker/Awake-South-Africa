/**
 * SEO and Performance E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('SEO Meta Tags', () => {
  test('homepage should have correct meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Awake SA.*Electric Surfboards/);
    
    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(50);
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
  });

  test('product page should have correct meta tags', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    // Navigate to first product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Check title contains product info
    const title = await page.title();
    expect(title).toContain('Awake SA');
    
    // Check canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    if (canonical) {
      expect(canonical).toContain('awakesa.co.za');
    }
  });

  test('should have structured data on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check for JSON-LD structured data
    const structuredData = await page.locator('script[type="application/ld+json"]').count();
    expect(structuredData).toBeGreaterThan(0);
  });

  test('sitemap should be accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    
    const content = await page.content();
    expect(content).toContain('<?xml');
    expect(content).toContain('<urlset');
  });

  test('robots.txt should be accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    
    const content = await page.content();
    expect(content).toContain('User-agent');
    expect(content).toContain('Sitemap:');
  });
});

test.describe('Performance', () => {
  test('homepage should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('images should use Next.js Image optimization', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('img', { timeout: 5000 });
    
    // Check if images are using Next.js optimization
    const images = await page.locator('img').all();
    
    if (images.length > 0) {
      const firstImg = images[0];
      const src = await firstImg.getAttribute('src');
      
      // Next.js optimized images typically have _next/image in the path
      // or use srcset for responsive images
      const hasSrcSet = await firstImg.getAttribute('srcset');
      const isOptimized = src?.includes('_next') || hasSrcSet !== null;
      
      expect(isOptimized).toBeTruthy();
    }
  });

  test('should have no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (error) => !error.includes('ResizeObserver') && !error.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should lazy load images below fold', async ({ page }) => {
    await page.goto('/');
    
    // Get all images
    const images = await page.locator('img').all();
    
    if (images.length > 3) {
      // Check if below-fold images have loading="lazy"
      const belowFoldImg = images[3];
      const loading = await belowFoldImg.getAttribute('loading');
      
      // Should be lazy loaded
      expect(loading).toBe('lazy');
    }
  });
});

test.describe('Accessibility', () => {
  test('homepage should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Should have h1
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('img', { timeout: 5000 });
    
    const images = await page.locator('img').all();
    
    for (const img of images.slice(0, 5)) { // Check first 5 images
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Should be able to focus on interactive elements
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });
});
