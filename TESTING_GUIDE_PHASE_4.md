# 🧪 Testing Guide - Awake Store

## Overview

This project uses a comprehensive testing strategy with:
- **Jest** for unit and integration tests
- **React Testing Library** for component tests
- **Playwright** for end-to-end (E2E) tests

---

## 📁 Test Structure

```
tests/
├── setup.ts                          # Jest configuration
├── e2e/                              # End-to-end tests
│   ├── homepage.spec.ts             # Homepage tests
│   ├── product-browsing.spec.ts     # Product browsing flow
│   ├── shopping-cart.spec.ts        # Cart functionality
│   └── seo-performance.spec.ts      # SEO & performance
│
src/
├── components/__tests__/             # Component unit tests
│   └── OptimizedImage.test.tsx
└── lib/
    └── seo/__tests__/               # SEO utility tests
        ├── metadata.test.ts
        └── structured-data.test.ts
```

---

## 🚀 Running Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test product-browsing
```

### Run All Tests

```bash
npm run test:all
```

---

## 📝 Test Coverage

### Unit Tests

#### **OptimizedImage Component**
- ✅ Renders with correct props
- ✅ Shows loading state
- ✅ Handles load errors gracefully
- ✅ Applies priority loading
- ✅ Applies custom className

#### **SEO Metadata Utilities**
- ✅ Generates product metadata
- ✅ Truncates long descriptions
- ✅ Creates Open Graph tags
- ✅ Creates Twitter Card tags
- ✅ Handles relative URLs

#### **Structured Data**
- ✅ Product schema generation
- ✅ Organization schema
- ✅ Website schema
- ✅ Breadcrumb schema
- ✅ Rating inclusion/exclusion

### E2E Tests

#### **Product Browsing**
- ✅ Display product listing
- ✅ Filter by category
- ✅ Search functionality
- ✅ Navigate to product details
- ✅ Add to cart
- ✅ Toggle wishlist

#### **Shopping Cart**
- ✅ Display empty cart
- ✅ Add items to cart
- ✅ Update quantities
- ✅ Remove items
- ✅ Display totals
- ✅ Navigate to checkout

#### **SEO & Performance**
- ✅ Meta tags present
- ✅ Structured data included
- ✅ Sitemap accessible
- ✅ Robots.txt accessible
- ✅ Page load performance
- ✅ Image optimization
- ✅ No console errors

#### **Accessibility**
- ✅ Proper heading structure
- ✅ Alt text on images
- ✅ Keyboard navigation

---

## 🔧 Writing Tests

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should navigate to products', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Products');
  await expect(page).toHaveURL(/\/products/);
});
```

---

## 🎯 Test Data Attributes

Add test IDs to components for reliable E2E testing:

```tsx
<div data-testid="product-card">
  <h3>{product.name}</h3>
  <p>{product.price}</p>
</div>
```

Then in tests:

```typescript
const productCard = page.locator('[data-testid="product-card"]');
await expect(productCard).toBeVisible();
```

---

## 📊 Coverage Requirements

Current coverage thresholds (jest.config.js):

| Metric | Threshold |
|--------|-----------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

---

## 🐛 Debugging Tests

### Debug Unit Tests

```bash
# Run specific test file
npm test -- OptimizedImage.test.tsx

# Run in watch mode
npm run test:watch

# View coverage
npm run test:coverage
```

### Debug E2E Tests

```bash
# Run with headed browser
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# View test report
npx playwright show-report
```

---

## ✅ Testing Checklist

### Before Committing
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Coverage meets thresholds
- [ ] No console errors in E2E tests
- [ ] New features have tests

### Before Deploying
- [ ] Run full test suite
- [ ] Check test reports
- [ ] Verify no flaky tests
- [ ] Update test documentation

---

## 🔍 Common Issues

### Issue: Tests timing out
**Solution**: Increase timeout in playwright.config.ts or add explicit waits

### Issue: Cannot find element
**Solution**: Use data-testid attributes or wait for element to be visible

### Issue: Flaky tests
**Solution**: Add proper wait conditions, avoid hard timeouts

### Issue: Mock data not working
**Solution**: Check tests/setup.ts for mock configuration

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

---

## 🎯 Next Steps

1. **Add more E2E tests** for:
   - Checkout flow
   - Payment processing
   - User authentication
   - Admin dashboard

2. **Improve coverage** for:
   - Store management (Zustand)
   - API hooks
   - Utility functions

3. **Performance testing**:
   - Lighthouse CI integration
   - Load testing
   - Memory leak detection

4. **Visual regression testing**:
   - Screenshot comparison
   - Component visual tests
