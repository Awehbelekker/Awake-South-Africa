# Quick Fix: Admin Panel Showing "Local Storage (44 products)"

## Problem
Admin dashboard shows "Local Storage (44 products)" instead of "Supabase (92 products)" because:
1. Localhost doesn't have a detected tenant (no subdomain)
2. Products fetch requires a valid `tenant_id`
3. Without tenant ID, Supabase products don't load

## Solution Applied ✅

### 1. Updated `/api/tenant` to use Awake tenant in development
```typescript
// Now detects localhost and automatically uses Awake tenant
if (request.headers.get('host')?.includes('localhost')) {
  // Loads Awake tenant from database with full ID
}
```

### 2. Enhanced product sync logging
```typescript
// Shows which tenant products are loading for
console.log('Fetching products for tenant:', tenantId, tenant?.name)
```

## How to Test

### Step 1: Restart Dev Server
```bash
# Ctrl+C to stop current server
npm run dev
```

### Step 2: Hard Refresh Browser
```
Chrome/Edge: Ctrl + Shift + R
Firefox: Ctrl + F5
Safari: Cmd + Option + R
```

### Step 3: Check Browser Console
Open DevTools (F12) and look for:
```
✅ Loaded 86 products from Supabase for Awake Boards SA
🔧 Debug Info: { productSource: 'supabase', productCount: 86, ... }
```

### Step 4: Check Admin Dashboard
Visit: http://localhost:3000/admin/dashboard

Should show:
```
[Products: Supabase (86)] [Orders: Local Storage]
```

### Step 5: Test Tenant API
```bash
node scripts/test-tenant-api.js
```

Expected output:
```
✅ Tenant detected:
   Name: Awake Boards SA
   Slug: awake
   ID: 7f219734-0293-4dca-9c91-2f1a5aea78dd

✅ Full tenant object returned (good for product fetching)
```

## Still Showing localStorage?

### Clear Zustand Cache
The products store persists to localStorage. Clear it:

1. Open DevTools (F12) → Application tab
2. Find "Local Storage" → http://localhost:3000
3. Delete key: `products-storage`
4. Refresh page

OR run in browser console:
```javascript
localStorage.removeItem('products-storage')
location.reload()
```

### Verify Supabase Connection
Check `.env.local` has correct values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://iepeffuszswxuwyqrzix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check Network Tab
1. Open DevTools → Network tab
2. Refresh page
3. Look for requests to:
   - `/api/tenant` → Should return Awake tenant with ID
   - Supabase API calls to `iepeffuszswxuwyqrzix.supabase.co`

## Architecture Summary

### Current Setup (Development)
```
localhost:3000
    ↓
Tenant API detects localhost → Returns Awake tenant
    ↓
useSupabaseProducts fetches products for Awake (tenant_id = 7f219734...)
    ↓
86 products loaded from Supabase
    ↓
Admin shows "Products: Supabase (86)"
```

### Future: Multi-Tenant Subdomains
```
kelp.yourdomain.com
    ↓
Middleware detects subdomain = "kelp"
    ↓
Tenant API returns Kelp tenant (tenant_id = 48fd8da0...)
    ↓
useSupabaseProducts fetches Kelp's 3 products
    ↓
Customer sees Kelp-branded store with only Kelp products
```

### Future: Separate Client Sites
```
Client 1: awakesa.co.za (this repo)
    ↓
.env: NEXT_PUBLIC_TENANT_ID=awake-id
    ↓
Fetches 86 Awake products

Client 2: kelpboards.co.za (cloned repo)
    ↓
.env: NEXT_PUBLIC_TENANT_ID=kelp-id
    ↓
Fetches 3 Kelp products

Both connect to same Supabase database!
```

## Debug Panel

Click the **🔧 Debug** button (bottom-right corner) to see:
- Supabase connection status
- Current tenant (should be "Awake Boards SA")
- Product count and source
- Category breakdown

## What to Expect After Fix

### Before:
```
Products: Local Storage (44 products)
Orders: Local Storage
```

### After:
```
Products: Supabase (86 products)  ← Blue badge
Orders: Local Storage  ← Yellow (normal - not using Supabase yet)
```

Note: Orders still use localStorage because we haven't migrated them yet. That's fine for now.

## Next Steps (After This Works)

1. ✅ Verify Supabase products loading
2. 📱 Test on different subdomains (requires DNS setup)
3. 🚀 Deploy to Vercel with production domain
4. 🏪 Set up Kelp's separate frontend OR subdomain
5. 🔐 Add client admin portals for self-service product management

---

**Need help?** Share:
- Browser console output (F12 → Console tab)
- Network tab showing `/api/tenant` response
- Screenshot of admin dashboard
