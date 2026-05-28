# 🧪 Testing Guide - How to Test Everything

## Quick Start

1. **Start Dev Server** (if not already running)
   ```bash
   cd services/storefront
   npm run dev
   ```

2. **Open Admin Dashboard**
   - URL: http://localhost:3000/admin/products
   - Password: `awake2026admin`

## Test 1: Preview Mode (Your Specific Request!)

### Steps:
1. ✅ Click "Edit" on any product (e.g., "Awake RÄVIK Explore")
2. ✅ Find the "Description" field (has rich text editor)
3. ✅ Type some text: "This is a **bold** test"
4. ✅ Click the **"Preview"** button (top right of editor)
5. ✅ Verify you see formatted text with bold
6. ✅ Click **"Edit"** to return to editing mode
7. ✅ Verify you can continue editing

### Expected Result:
- Preview mode shows formatted HTML
- Bold text appears bold
- Edit mode shows editable content
- Toggle works smoothly

## Test 2: Real Product Images (Your Specific Request!)

### Steps:
1. ✅ Scroll through the products table
2. ✅ Verify each product has a unique image
3. ✅ Check these specific products:
   - **RÄVIK Explore**: Should show `23RE-FRONT-ICON.jpg`
   - **VINGA Adventure**: Should show `VINGA-ADV-ICON-TRANS.png`
   - **BRABUS Shadow**: Should show `BRABUS-BP-FRONT-1000x1000.png`
4. ✅ Click "Edit" on a product
5. ✅ Verify image preview shows in modal

### Expected Result:
- All products have real Awake images
- Images are high quality
- No placeholder images
- Images load from Awake CDN

## Test 3: Real Product Descriptions

### Steps:
1. ✅ Click "Edit" on "Awake RÄVIK Explore"
2. ✅ Check the description field
3. ✅ Verify it says: "Entry-level electric jetboard with impressive performance. Perfect for beginners and families looking to experience the thrill of electric surfing."
4. ✅ Click "Edit" on "Awake Flex Battery LR 4"
5. ✅ Verify description mentions "90 minutes ride time"

### Expected Result:
- Descriptions are detailed and accurate
- Match real Awake product information
- Include specific details (battery life, features, etc.)

## Test 4: Array Field Editors

### Steps:
1. ✅ Click "Edit" on any product
2. ✅ Find the "Specs" field
3. ✅ Click the **"+"** button to add a new spec
4. ✅ Type: "New spec item"
5. ✅ Click the **"×"** button to remove an item
6. ✅ Click the **"↑"** or **"↓"** buttons to reorder
7. ✅ Repeat for "Features" field

### Expected Result:
- Can add new items
- Can remove items
- Can reorder items
- Changes are reflected immediately

## Test 5: Product Edit Modal

### Steps:
1. ✅ Click "Edit" on any product
2. ✅ Verify modal opens full screen
3. ✅ Edit the product name
4. ✅ Edit the price
5. ✅ Edit the description with formatting
6. ✅ Click "Save Changes"
7. ✅ Verify toast notification appears
8. ✅ Verify changes are saved

### Expected Result:
- Modal opens smoothly
- All fields are editable
- Save button works
- Toast notification shows success
- Changes persist

## Test 6: Validation

### Steps:
1. ✅ Click "Edit" on any product
2. ✅ Clear the "Name" field (make it empty)
3. ✅ Click "Save Changes"
4. ✅ Verify error message appears: "Name must be at least 1 character"
5. ✅ Enter a valid name
6. ✅ Clear the "Price" field
7. ✅ Click "Save Changes"
8. ✅ Verify error message appears

### Expected Result:
- Validation prevents saving invalid data
- Error messages are clear
- Red border appears on invalid fields
- Can fix errors and save successfully

## Test 7: Unsaved Changes Warning

### Steps:
1. ✅ Click "Edit" on any product
2. ✅ Make some changes (edit name or description)
3. ✅ Try to close the browser tab
4. ✅ Verify browser shows "unsaved changes" warning
5. ✅ Cancel and return to modal
6. ✅ Click "Save Changes"
7. ✅ Try to close tab again
8. ✅ Verify no warning appears

### Expected Result:
- Warning appears when there are unsaved changes
- No warning after saving
- Prevents accidental data loss

## Test 8: All 44 Products Display

### Steps:
1. ✅ Scroll through the products table
2. ✅ Count the products (should be 44)
3. ✅ Verify these categories exist:
   - Jetboards (4 products)
   - Limited Edition (1 product)
   - eFoils (4 products)
   - Batteries (3 products)
   - Wing Kits (2 products)
   - Bags (3 products)
   - Safety & Storage (4 products)
   - Electronics (4 products)
   - Parts (7 products)
   - Apparel (5 products)

### Expected Result:
- All 44 products are visible
- Each has real image and data
- Prices are in ZAR
- All categories represented

## Test 9: Rich Text Formatting

### Steps:
1. ✅ Click "Edit" on any product
2. ✅ In description field, select some text
3. ✅ Click **"B"** button (bold)
4. ✅ Verify text becomes bold
5. ✅ Click **"I"** button (italic)
6. ✅ Verify text becomes italic
7. ✅ Click bullet list button
8. ✅ Type a list item and press Enter
9. ✅ Click "Preview" to see formatted output

### Expected Result:
- Formatting toolbar works
- Bold, italic, lists all work
- Preview shows formatted text
- HTML is rendered correctly

## Test 10: Loading States

### Steps:
1. ✅ Click "Edit" on any product
2. ✅ Make a change
3. ✅ Click "Save Changes"
4. ✅ Observe the button during save
5. ✅ Verify spinner appears
6. ✅ Verify button text changes to "Saving..."
7. ✅ Verify button is disabled during save

### Expected Result:
- Loading spinner appears
- Button shows "Saving..."
- Button is disabled during save
- Returns to normal after save

## Troubleshooting

### Issue: Dev server not starting
**Solution**: 
```bash
cd services/storefront
npm install
npm run dev
```

### Issue: Images not loading
**Solution**: Check internet connection (images load from Awake CDN)

### Issue: Preview mode not working
**Solution**: Refresh the page and try again

### Issue: Changes not saving
**Solution**: Check browser console for errors

## Success Criteria

✅ All 10 tests pass
✅ Preview mode works perfectly
✅ All 44 products display with real images
✅ Validation prevents bad data
✅ Toast notifications appear
✅ No console errors

---

**Ready to Test!** Follow the tests above to verify everything works! 🚀

