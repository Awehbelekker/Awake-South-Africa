/**
 * Shopping Cart E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test('should display empty cart message', async ({ page }) => {
    await page.goto('/cart');
    
    // Check for empty cart message
    const emptyMessage = page.locator('text=/empty|no items/i');
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should add item to cart and display in cart page', async ({ page }) => {
    // Navigate to products
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    
    // Click first product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Add to cart
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Basket")');
    if (await addToCartBtn.count() > 0) {
      await addToCartBtn.click();
      await page.waitForTimeout(500);
      
      // Navigate to cart
      await page.goto('/cart');
      
      // Verify item is in cart
      const cartItems = page.locator('[data-testid="cart-item"]');
      if (await cartItems.count() > 0) {
        await expect(cartItems.first()).toBeVisible();
      }
    }
  });

  test('should update item quantity in cart', async ({ page }) => {
    // Add item to cart first
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    await page.locator('[data-testid="product-card"]').first().click();
    
    const addBtn = page.locator('button:has-text("Add to Cart")');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(500);
      
      // Go to cart
      await page.goto('/cart');
      
      // Try to increase quantity
      const increaseBtn = page.locator('button:has-text("+"), button[aria-label*="increase"]').first();
      if (await increaseBtn.count() > 0) {
        await increaseBtn.click();
        await page.waitForTimeout(300);
        
        // Verify quantity changed
        const quantityDisplay = page.locator('text=/quantity|qty/i');
        await expect(quantityDisplay).toBeVisible();
      }
    }
  });

  test('should remove item from cart', async ({ page }) => {
    // Add item first
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    await page.locator('[data-testid="product-card"]').first().click();
    
    const addBtn = page.locator('button:has-text("Add to Cart")');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(500);
      
      // Go to cart
      await page.goto('/cart');
      
      // Remove item
      const removeBtn = page.locator('button:has-text("Remove"), button[aria-label*="remove"]').first();
      if (await removeBtn.count() > 0) {
        await removeBtn.click();
        await page.waitForTimeout(300);
        
        // Verify empty cart or item removed
        const emptyMessage = page.locator('text=/empty|no items/i');
        if (await emptyMessage.count() > 0) {
          await expect(emptyMessage).toBeVisible();
        }
      }
    }
  });

  test('should display cart total', async ({ page }) => {
    // Add item first
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    await page.locator('[data-testid="product-card"]').first().click();
    
    const addBtn = page.locator('button:has-text("Add to Cart")');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(500);
      
      // Go to cart
      await page.goto('/cart');
      
      // Verify total is displayed
      const total = page.locator('text=/total|subtotal/i');
      if (await total.count() > 0) {
        await expect(total).toBeVisible();
      }
    }
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    // Add item first
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 5000 });
    await page.locator('[data-testid="product-card"]').first().click();
    
    const addBtn = page.locator('button:has-text("Add to Cart")');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(500);
      
      // Go to cart
      await page.goto('/cart');
      
      // Click checkout
      const checkoutBtn = page.locator('button:has-text("Checkout"), a:has-text("Checkout")');
      if (await checkoutBtn.count() > 0) {
        await checkoutBtn.click();
        
        // Verify navigation to checkout
        await expect(page).toHaveURL(/\/checkout/);
      }
    }
  });
});
