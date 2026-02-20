# 🚀 Complete Migration Execution Guide

**Date:** February 18, 2026  
**Status:** Ready to Execute  
**Products:** 44 in localStorage → Migrate to Database

---

## 📊 What's Been Created

✅ **Export Tool** - `scripts/export-products-from-browser.html`  
✅ **Supabase Setup** - `scripts/setup-supabase.ts`  
✅ **Supabase Migration** - `scripts/migrate-products.ts`  
✅ **Medusa Migration** - `scripts/migrate-local-to-medusa.ts`  
✅ **Supabase Service** - `src/lib/supabase-products.ts`  
✅ **Hybrid Products Hook** - `src/hooks/useHybridProducts.ts`

---

## 🎯 Migration Path (Choose One)

### Path A: Supabase (Recommended - Easiest)
**Setup Time:** 15 minutes  
**Difficulty:** Easy  
**Cost:** Free tier available  

### Path B: Medusa  
**Setup Time:** 30 minutes  
**Difficulty:** Medium  
**Cost:** Free (self-hosted)

### Path C: Both (Full Stack)
**Setup Time:** 45 minutes  
**Difficulty:** Advanced  
**Cost:** Minimal

---

## 📦 Step 1: Export Your Products (5 minutes)

### Option A: Using HTML Tool (Easiest)

```powershell
# Open the export tool in your browser
Start-Process "h:\Awake Store\scripts\export-products-from-browser.html"
```

**In the browser:**
1. Wait for status to show "Ready! Found 44 products"
2. Click "📦 Export Products"
3. File downloads as: `awake-products-backup-2026-02-18.json`

### Option B: Manual Export

1. Open your site: http://localhost:3000
2. Press `F12` (Developer Tools)
3. Go to **Console** tab
4. Paste and run:
```javascript
const products = JSON.parse(localStorage.getItem('products-storage')).state.products
const blob = new Blob([JSON.stringify(products, null, 2)], {type: 'application/json'})
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'awake-products-backup-' + new Date().toISOString().split('T')[0] + '.json'
a.click()
```

✅ **Checkpoint:** You should have `awake-products-backup-2026-02-18.json` in Downloads

---

## 🔵 Path A: Migrate to Supabase

### Step 2A: Create Supabase Project (5 min)

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** Awake Store
   - **Database Password:** (choose secure password)
   - **Region:** Closest to you (or Frankfurt for SA)
4. Click "Create Project"
5. Wait 2-3 minutes for project to initialize

### Step 3A: Run Database Schema (2 min)

1. In Supabase Dashboard, click **SQL Editor** (left menu)
2. Click "New Query"
3. Open: `h:\Awake Store\supabase\schema.sql`
4. Copy ALL contents
5. Paste into SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. ✅ Should see "Success. No rows returned"

### Step 4A: Configure Environment (2 min)

**Get your credentials:**
1. In Supabase, click **Settings** → **API**
2. Copy **Project URL**
3. Copy **anon public** key
4. Copy **service_role** key (click "Reveal")

**Run setup:**
```powershell
cd "h:\Awake Store"
npx tsx scripts/setup-supabase.ts
```

Follow the prompts and paste your credentials.

### Step 5A: Migrate Products (3 min)

```powershell
# Make sure you're in the project directory
cd "h:\Awake Store"

# Copy backup file to project root
Copy-Item "$env:USERPROFILE\Downloads\awake-products-backup-2026-02-18.json" .

# Run migration
npx tsx scripts/migrate-products.ts awake-products-backup-2026-02-18.json
```

✅ **Should see:** "🎉 All products migrated successfully to Supabase!"

### Step 6A: Verify (2 min)

1. Go to Supabase Dashboard
2. Click **Table Editor** → **products**
3. ✅ Should see 44 products

---

## 🟠 Path B: Migrate to Medusa

### Step 2B: Set Up Medusa Admin (5 min)

1. Visit: https://awake-south-africa-production.up.railway.app/app
2. Create admin account:
   - **Email:** your-email@example.com
   - **Password:** (choose secure password)
3. Login

### Step 3B: Configure Credentials (2 min)

Add to `.env.local`:
```env
MEDUSA_ADMIN_EMAIL=your-email@example.com
MEDUSA_ADMIN_PASSWORD=your-password
```

### Step 4B: Migrate Products (3 min)

```powershell
cd "h:\Awake Store"

# Copy backup to project root
Copy-Item "$env:USERPROFILE\Downloads\awake-products-backup-2026-02-18.json" .

# Run migration
npx tsx scripts/migrate-local-to-medusa.ts awake-products-backup-2026-02-18.json
```

✅ **Should see:** "🎉 All products migrated successfully!"

### Step 5B: Verify (2 min)

1. Go to Medusa Admin: https://awake-south-africa-production.up.railway.app/app
2. Click **Products** in left menu
3. ✅ Should see 44 products

---

## 🟢 Path C: Both (Supabase + Medusa)

**Follow both paths above:**
1. Complete Path A (Supabase) first
2. Then complete Path B (Medusa)
3. App will use Supabase as primary, Medusa as backup

---

## ✅ Post-Migration Verification

### Test the App

```powershell
cd "h:\Awake Store"
npm run dev
```

Visit: http://localhost:3000

**Check:**
- [ ] Products page loads
- [ ] All 44 products visible
- [ ] Product details open correctly
- [ ] Images load properly
- [ ] Add to cart works

### Admin Dashboard

Visit: http://localhost:3000/admin

**Check:**
- [ ] Login works
- [ ] Products list shows 44 items
- [ ] Data source indicator shows correct source:
  - "Supabase" or
  - "Medusa API" or
  - "Local Storage"
- [ ] Edit a product and save
- [ ] Changes persist after refresh

---

## 🎯 What Changes in Your App

### Before Migration
```
User visits site → Loads from localStorage → Works only on this browser
```

### After Migration (Supabase)
```
User visits site → Loads from Supabase → Works everywhere
Admin edits product → Saves to Supabase → Updates for all users
```

### After Migration (Medusa)
```
User visits site → Loads from Medusa API → Works everywhere
Admin edits product → Saves to Medusa → Updates for all users
Orders stored in Medusa → Full e-commerce features
```

---

## 📁 Files Changed/Created

### New Files
- ✅ `scripts/export-products-from-browser.html` - Export tool
- ✅ `scripts/setup-supabase.ts` - Supabase configuration helper
- ✅ `scripts/migrate-local-to-medusa.ts` - Medusa migration (updated)
- ✅ `src/lib/supabase-products.ts` - Supabase product service
- ✅ `src/hooks/useHybridProducts.ts` - Smart product loader

### Updated Files
- ✅ `scripts/migrate-products.ts` - Updated for new format
- ✅ `.env.local` - Will add Supabase credentials

### No Changes Needed
- ✅ Your existing components work as-is
- ✅ No breaking changes
- ✅ Backward compatible with localStorage

---

## 🔄 Rollback Plan

If something goes wrong:

### Keep Using LocalStorage
```powershell
# Just don't add Supabase env vars
# App will continue using localStorage
```

### Restore from Backup
```javascript
// In browser console:
const backup = [/* paste your backup */]
localStorage.setItem('products-storage', JSON.stringify({
  state: { products: backup }
}))
location.reload()
```

---

## 🆘 Troubleshooting

### "No products found in localStorage"
**Solution:** Make sure your site is running and products have loaded before exporting

### "Supabase authentication failed"
**Solution:** Check your credentials in .env.local, make sure you copied the correct keys

### "Medusa authentication failed"
**Solution:** 
1. Make sure you created an admin account at /app
2. Check email/password in .env.local
3. Verify backend is running: `Invoke-WebRequest https://awake-south-africa-production.up.railway.app/health`

### "Products not showing in app"
**Solution:**
1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Check browser console for errors (F12)

### "Migration script errors"
**Solution:**
1. Make sure you're in project directory
2. Check .env.local has correct credentials
3. Verify database schema is applied
4. Try running one product at a time

---

## 📞 Next Steps After Migration

### Immediate (Today)
- [ ] Export products (done above)
- [ ] Choose migration path
- [ ] Run migration
- [ ] Verify products loaded
- [ ] Test app functionality

### This Week
- [ ] Update product images if needed
- [ ] Review product data for accuracy
- [ ] Set up product categories properly
- [ ] Configure stock quantities

### Future Enhancements
- [ ] Add product search
- [ ] Implement filters
- [ ] Add product reviews
- [ ] Set up automated backups
- [ ] Add inventory tracking

---

## ✨ Benefits After Migration

### For You (Admin)
✅ Edit products from any device  
✅ Changes sync instantly  
✅ No risk of losing data  
✅ Professional database backend  
✅ Better performance  

### For Customers
✅ Always see latest products  
✅ Real-time stock levels  
✅ Faster page loads  
✅ Better reliability  
✅ Consistent experience across devices  

---

## 🎉 Ready to Start?

**Pick your path and let's go:**

### Supabase (Easiest)
```powershell
Start-Process "h:\Awake Store\scripts\export-products-from-browser.html"
```

### Medusa (Full E-commerce)
```powershell
Start-Process "https://awake-south-africa-production.up.railway.app/app"
```

### Both (Full Stack)
```powershell
# Do both paths above!
```

---

**Questions? Issues? Check the troubleshooting section or review the error messages - they're designed to be helpful!**

🏄 Let's migrate those products!
