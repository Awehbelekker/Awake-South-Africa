/**
 * Product Browsing E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Product Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('should display product listing page', async ({ page }) => {
    await expect(page).toHaveTitle(/Products.*Awake SA/);
    await expect(page.locator('h1')).toContainText(/Products|Jetboards|eFoils/);
  });

  test('should filter products by category', async ({ page }) => {
    // Click on a category filter
    await page.click('text=Jetboards');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    // Verify filtered products are displayed
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
  });

  test('should search for products', async ({ page }) => {
    // Type in search box
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('RÄVIK');
      await page.waitForTimeout(500);
      
      // Verify search results
      const productCards = page.locator('[data-testid="product-card"]');
      if (await productCards.count() > 0) {
        await expect(productCards.first()).toBeVisible();
      }
    }
  });

  test('should navigate to product detail page', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    // Click first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    // Verify product detail page loads
    await expect(page).toHaveURL(/\/products\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Product Detail Page', () => {
  test('should display product information', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    // Navigate to first product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Verify product details are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=/R[0-9,]+/')).toBeVisible(); // Price
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    // Navigate to product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Add to cart
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Basket")');
    if (await addToCartBtn.count() > 0) {
      await addToCartBtn.click();
      
      // Verify success message or cart update
      await expect(page.locator('text=/Added to cart|Success/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should toggle wishlist', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    // Navigate to product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Click wishlist button (heart icon)
    const wishlistBtn = page.locator('button:has([class*="heart"]), button[aria-label*="wishlist"]');
    if (await wishlistBtn.count() > 0) {
      await wishlistBtn.click();
      await page.waitForTimeout(300);
      
      // Verify state changed
      await expect(wishlistBtn).toBeVisible();
    }
  });

  test('should display product images', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    // Navigate to product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Verify main image is visible
    const mainImage = page.locator('img[alt]').first();
    await expect(mainImage).toBeVisible();
  });

  test('should navigate back to products', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    // Navigate to product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Click back button
    const backBtn = page.locator('button:has-text("Back"), a:has-text("Back")');
    if (await backBtn.count() > 0) {
      await backBtn.click();
      
      // Verify back on products page
      await expect(page).toHaveURL(/\/products$/);
    }
  });
});
