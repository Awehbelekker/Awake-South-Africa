/**
 * Homepage E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loaded
    await expect(page).toHaveTitle(/Awake/)
    
    // Check for main navigation
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })
  
  test('should display products', async ({ page }) => {
    await page.goto('/')
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })
    
    // Check that at least one product is displayed
    const products = page.locator('[data-testid="product-card"]')
    await expect(products.first()).toBeVisible()
  })
  
  test('should navigate to product page', async ({ page }) => {
    await page.goto('/')
    
    // Click on first product
    await page.click('[data-testid="product-card"]:first-child')
    
    // Check that we're on a product page
    await expect(page).toHaveURL(/\/products\//)
  })
  
  test('should open cart', async ({ page }) => {
    await page.goto('/')
    
    // Click cart button
    await page.click('[data-testid="cart-button"]')
    
    // Check that cart is visible
    const cart = page.locator('[data-testid="cart-sidebar"]')
    await expect(cart).toBeVisible()
  })
})

