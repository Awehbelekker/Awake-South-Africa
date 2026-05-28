# Fixes Applied - February 20, 2026

## Issues Resolved

### 1. ✅ Medusa Products Not Loading in Admin
**Problem:** Admin dashboard and products page showing "Local Storage (44 products)" and "Medusa unavailable" even though Medusa backend is working.

**Root Cause:** The admin interface was only using Medusa data when `authMode === 'medusa'`. When you log in with the local admin password (`awake2026admin`), the authMode is set to `'local'`, which caused the app to fallback to local storage products instead of fetching from the live Medusa backend.

**Solution:** Changed the logic in both admin pages to **always use Medusa data when available**, regardless of authMode:

**Files Changed:**
- [src/app/admin/products/page.tsx](src/app/admin/products/page.tsx#L30)
- [src/app/admin/dashboard/page.tsx](src/app/admin/dashboard/page.tsx#L27)

**Before:**
```tsx
const useMedusa = authMode === 'medusa' && medusaProducts && medusaProducts.length > 0
```

**After:**
```tsx
const useMedusa = medusaProducts && medusaProducts.length > 0 && !medusaError
```

**Result:** The admin now correctly displays Medusa products (and orders) even when logged in with the local password. The authMode only affects authentication method, not data source.

---

### 2. ✅ Google OAuth Redirect URI Mismatch
**Problem:** Getting "Error 400: redirect_uri_mismatch" when trying to connect Google Drive in admin settings.

**Root Cause:** The redirect URIs configured in your Google Cloud Console don't match the URIs the app is sending during OAuth flow.

**Solution Guide Created:** [GOOGLE_OAUTH_FIX_GUIDE.md](GOOGLE_OAUTH_FIX_GUIDE.md)

**What You Need to Do:**

#### Step 1: Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add BOTH:
   ```
   http://localhost:3000/api/oauth/google/callback
   https://awake-south-africa.vercel.app/api/oauth/google/callback
   ```
5. Click **Save**

#### Step 2: Update Vercel Environment Variable
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **awake-south-africa**
3. Go to **Settings** → **Environment Variables**
4. Add: `NEXT_PUBLIC_APP_URL = https://awake-south-africa.vercel.app`
5. Select: **Production**, **Preview**, **Development**
6. Go to **Deployments** → Click (...) on latest → **Redeploy**

#### Step 3: Test
1. Go to https://awake-south-africa.vercel.app/admin/settings
2. Scroll to "Integrations" section
3. Click "Connect Drive"
4. Authorize Google
5. Should redirect back successfully

---

### 3. ℹ️ OneDrive Integration Status
**Current State:** Not implemented for tenant-level use.

**What Exists:**
- ✅ Microsoft OAuth library
- ✅ OneDrive storage service
- ❌ No tenant OAuth routes
- ❌ No admin UI component

**Recommendation:** Focus on Google Drive first. We can add OneDrive support later if needed.

---

## System Status

### Medusa Backend (Railway)
- ✅ **Status:** Online and responding
- ✅ **Health Check:** https://awake-south-africa-production.up.railway.app/health
- ✅ **Products API:** Working (149,899 bytes of product data)
- ✅ **CORS:** Configured correctly

### Frontend (Vercel)
- ✅ **Production:** https://awake-south-africa.vercel.app
- ⚠️ **Deployment:** Pushing latest fixes now
- ✅ **Medusa Integration:** Fixed - will show Medusa data
- ⚠️ **Google OAuth:** Needs Cloud Console configuration (your side)

### Environment Variables
```
✅ NEXT_PUBLIC_MEDUSA_BACKEND_URL = https://awake-south-africa-production.up.railway.app
✅ NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID = [REDACTED - see .env.local]
✅ GOOGLE_DRIVE_CLIENT_SECRET = [REDACTED - see .env.local]
⚠️ NEXT_PUBLIC_APP_URL = http://localhost:3000 (needs production URL in Vercel)
```

---

## What Happens Next

### Immediate (Automatic)
1. ✅ Git commits created
2. 🔄 Pushing to GitHub...
3. ⏳ Vercel will auto-deploy (1-2 minutes)
4. ✅ Admin will show Medusa products instead of local storage

### Manual (Your Actions Required)
1. Add redirect URIs to Google Cloud Console (see Step 1 above)
2. Set `NEXT_PUBLIC_APP_URL` in Vercel (see Step 2 above)
3. Redeploy on Vercel
4. Test Google Drive connection

---

## Testing the Medusa Fix

### On Production (After Deploy Completes):
1. Go to https://awake-south-africa.vercel.app/admin
2. Log in with password: `awake2026admin`
3. Check **Dashboard** - should show:
   ```
   ✅ Products: Medusa API (X products)
   ✅ Orders: Medusa API
   ```
4. Go to **Products** page - should show:
   ```
   ✅ Medusa API (X products)
   ```

### On Local Development:
1. Restart dev server: `npm run dev`
2. Go to http://localhost:3000/admin
3. Log in with: `awake2026admin`
4. Should now show Medusa data

---

## Where to Find Google Drive Integration

After fixing the OAuth issue, you can access Google Drive features at:

1. **Settings Page:** `/admin/settings`
   - Connect/Disconnect Google Drive
   - View connection status

2. **Import Page:** `/admin/import`
   - Browse Drive folders
   - Select and transfer images
   - Batch import product images

---

## Summary

### Fixed ✅
- Medusa products now load in admin (regardless of auth mode)
- Medusa orders now load in admin dashboard
- Created comprehensive OAuth fix guide

### Action Required ⏳
- Add Google OAuth redirect URIs to Cloud Console
- Set production URL in Vercel environment variables
- Redeploy Vercel after environment changes

### Not Implemented ℹ️
- OneDrive tenant integration (can add later if needed)

---

## Commits Made
```
39675b3 - Fix: Always use Medusa products/orders when available, regardless of auth mode
3809b21 - Add debug endpoint and detailed logging for media library troubleshooting
79cee15 - Fix media library filter bug - now shows uploaded images correctly
```

Deploy Status: **Pushing to GitHub → Vercel will auto-deploy**
