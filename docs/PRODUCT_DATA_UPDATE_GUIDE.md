# 📸 Product Data & Images Update Guide

## Problem
Web scraping the Awake website failed because product URLs returned 404 errors. We need to manually update product data with accurate information and images.

## Solution Options

### Option 1: Manual Update (Recommended for Now)

#### Step 1: Download Product Images
1. Visit https://awakeboards.com/collections/all
2. For each product, right-click on the product image
3. Select "Save image as..." or "Copy image address"
4. Save images to `services/storefront/public/images/products/`
5. Name them consistently: `vinga-3.jpg`, `ravik-s-22.jpg`, etc.

#### Step 2: Update Product Data
Edit `services/storefront/src/lib/constants/products.ts`:

```typescript
// Example: Update Vinga 3 product
{
  id: 'vinga-3',
  name: 'Vinga 3',
  price: 12900,
  priceExVAT: 11217,
  costEUR: 6500, // Update with real cost
  category: 'Jetboards',
  categoryTag: 'jetboards',
  description: '<p>The Vinga 3 is the perfect all-around electric surfboard...</p>', // Use HTML from rich text editor
  image: '/images/products/vinga-3.jpg', // Local image path
  badge: 'Popular',
  battery: 'Standard Battery',
  skillLevel: 'Intermediate',
  specs: [
    'Speed: 55 kph / 34 mph',
    'Weight: 23 kg / 50 lb',
    'Dimensions: 179 x 62 x 26 cm',
    'Ride Time: 45 mins',
    'Charging Time: 120 mins'
  ],
  features: [
    'V-shaped hull for stability',
    'Medium rocker for versatility',
    'Wide tail for comfort',
    'Carbon fiber construction',
    'Wireless hand controller'
  ],
  inStock: true,
  stockQuantity: 5
}
```

#### Step 3: Get Accurate Product Information
Visit each product page on awakeboards.com and copy:
- Product name
- Description (copy/paste into rich text editor, then save as HTML)
- Specifications
- Features
- Images
- Pricing (convert EUR to ZAR using R19.85 exchange rate)

### Option 2: Use Awake's Product API (If Available)
Contact Awake to see if they have:
- Product data export (CSV/JSON)
- API access
- Product image CDN URLs

### Option 3: Automated Image Hosting
Use a service like Cloudinary or AWS S3:
1. Upload all product images
2. Get CDN URLs
3. Update image URLs in product data

## Quick Reference: Product List

### Jetboards (8 products)
1. Vinga 3
2. Rävik S 22
3. Rävik 3
4. Rävik S 25
5. Rävik S BRABUS Shadow 800
6. Vinga 4
7. Rävik 4
8. Rävik S 4

### eFoils (4 products)
1. VINGA S eFoil
2. VINGA 3 eFoil
3. RÄVIK S eFoil
4. RÄVIK 3 eFoil

### Batteries (2 products)
1. Awake Flex Battery LR 4
2. Awake Flex Battery XR 4

### Accessories (22 products)
- Chargers, controllers, fins, stands, bags, etc.

## Example: Complete Product Update

```typescript
{
  id: 'vinga-3',
  name: 'Vinga 3',
  price: 12900, // EUR price * 1.15 (VAT) * 19.85 (exchange rate) = ZAR
  priceExVAT: 11217, // EUR price * 19.85
  costEUR: 6500, // Your cost in EUR
  category: 'Jetboards',
  categoryTag: 'jetboards',
  description: `
    <p><strong>The Vinga 3</strong> is the perfect all-around electric surfboard for riders of all skill levels.</p>
    <p>Combining versatility, comfort, and power, the Vinga 3 delivers an exceptional riding experience on any water condition.</p>
    <ul>
      <li>V-shaped hull for enhanced stability</li>
      <li>Medium rocker for versatile performance</li>
      <li>Wide tail for maximum comfort</li>
    </ul>
  `,
  image: 'https://awakeboards.com/cdn/shop/products/vinga-3.jpg', // Or local: '/images/products/vinga-3.jpg'
  badge: 'Popular',
  battery: 'Standard Battery',
  skillLevel: 'Intermediate',
  specs: [
    'Speed: 55 kph / 34 mph',
    'Weight: 23 kg / 50 lb',
    'Dimensions: 179 x 62 x 26 cm / 5\'9" x 24.4" x 10.2"',
    'Ride Time: 45 mins',
    'Charging Time: 120 mins',
    'Maximum Volume: 71 Liters',
    'Power Output: 11 KW'
  ],
  features: [
    'V-shaped hull with medium rocker',
    'Wide tail for stability and comfort',
    'Carbon fiber construction',
    'Wireless hand controller included',
    'Dual channel design',
    'Quick-release battery system',
    'Integrated GPS tracking',
    '2-year warranty'
  ],
  inStock: true,
  stockQuantity: 5
}
```

## Tips for Rich Text Descriptions

1. **Use the Rich Text Editor**:
   - Go to admin products page
   - Click "Edit" on a product
   - Use the rich text editor to format description
   - Add bold, italic, lists, links
   - Click "Preview" to see how it looks
   - Copy the HTML from browser dev tools

2. **HTML Structure**:
   ```html
   <p>Main description paragraph...</p>
   <p><strong>Key feature</strong> with emphasis</p>
   <ul>
     <li>Feature 1</li>
     <li>Feature 2</li>
   </ul>
   ```

3. **Keep it Clean**:
   - Use semantic HTML
   - Avoid inline styles
   - Use lists for features
   - Use bold for emphasis

## Testing Your Updates

1. Save changes to `products.ts`
2. Refresh the admin page
3. Click "Edit" on updated product
4. Verify all fields are correct
5. Test preview mode for description
6. Check image displays correctly

## Next Steps

1. Start with top 5 most popular products
2. Update descriptions, images, specs
3. Test in admin dashboard
4. Continue with remaining products
5. Consider setting up proper image hosting

---

**Need Help?**
- Check browser console for errors
- Verify image paths are correct
- Test one product at a time
- Use the rich text editor preview mode

