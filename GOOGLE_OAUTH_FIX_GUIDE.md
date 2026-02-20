# Google OAuth Redirect URI Fix Guide

## Problem
Getting **Error 400: redirect_uri_mismatch** when trying to connect Google Drive in admin settings.

## Root Cause
The redirect URI sent in the OAuth request doesn't match the URIs configured in Google Cloud Console.

---

## Solution: 3-Step Fix

### Step 1: Add Redirect URIs to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or the project with Client ID: `39956410829-ihrhivfrsenidriv66896el6r9u1m8md`)
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add BOTH:
   ```
   http://localhost:3000/api/oauth/google/callback
   https://awake-south-africa.vercel.app/api/oauth/google/callback
   ```
6. Click **Save**

### Step 2: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **awake-south-africa**
3. Go to **Settings** → **Environment Variables**
4. Add or update:
   ```
   NEXT_PUBLIC_APP_URL = https://awake-south-africa.vercel.app
   ```
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**
7. Go to **Deployments** tab
8. Click the three dots (...) on the latest deployment
9. Click **Redeploy**

### Step 3: Test the Connection

#### On Production:
1. Go to https://awake-south-africa.vercel.app/admin/settings
2. Scroll to **Integrations** section
3. Click **Connect Drive** button
4. Authorize Google permissions
5. Should redirect back with success message

#### On Local Development:
1. Make sure `.env.local` has:
   ```
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
2. Restart your dev server: `npm run dev`
3. Go to http://localhost:3000/admin/settings
4. Click **Connect Drive**
5. Authorize and verify success

---

## Where to Find Google Drive Integration

### Tenant Admin Access:
1. **Settings Page**: `/admin/settings`
   - Scroll to "Integrations" section
   - Shows Google Drive connection status
   - Connect/Disconnect buttons

2. **Import Page**: `/admin/import`
   - Google Drive browser (after connecting)
   - Select and transfer images from Drive
   - Create products from imported images

### What You Can Do After Connecting:
- ✅ Browse your Google Drive folders
- ✅ Select product images from Drive
- ✅ Batch transfer images to Supabase Storage
- ✅ Auto-create products from imported images
- ✅ Keep Drive as backup source

---

## OneDrive Integration Status

**Currently Not Implemented** for tenant-level use.

The codebase has:
- ✅ Microsoft OAuth library (`src/lib/oauth/microsoft-oauth.ts`)
- ✅ OneDrive storage library (`src/lib/cloud-storage/onedrive.ts`)
- ❌ No tenant-level OAuth routes for Microsoft
- ❌ No OneDrive connection component
- ❌ No admin UI for OneDrive

### To Add OneDrive Support (Future Enhancement):
Would need to create:
1. `/api/oauth/microsoft/authorize` route
2. `/api/oauth/microsoft/callback` route
3. `/api/tenant/onedrive/*` routes (browse, transfer, etc.)
4. `OneDriveConnection` component
5. Add to admin settings page

**Recommendation**: Get Google Drive working first, then we can implement OneDrive if needed.

---

## Troubleshooting

### Still Getting redirect_uri_mismatch?
1. Double-check the redirect URIs are EXACTLY:
   - `http://localhost:3000/api/oauth/google/callback` (for local)
   - `https://awake-south-africa.vercel.app/api/oauth/google/callback` (for production)
2. NO trailing slashes
3. Make sure you clicked "Save" in Google Cloud Console
4. Try clearing browser cache and cookies
5. Check if NEXT_PUBLIC_APP_URL is set in Vercel (see Step 2)

### Not Seeing Google Drive Section?
1. Make sure you're logged into tenant admin
2. Check `/admin/settings` page
3. Should see "Integrations" section with "Google Drive Integration"
4. If missing, check browser console for errors

### Connection Succeeds but Nothing Happens?
1. Check if tenant has `google_drive_connected` flag in database
2. Go to `/admin/import` to use the Drive browser
3. Check browser console for API errors
4. Try disconnecting and reconnecting

---

## Current Environment Status

**Environment Variables:**
- ✅ `NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID` = `39956410829-ihrhivfrsenidriv66896el6r9u1m8md`
- ✅ `GOOGLE_DRIVE_CLIENT_SECRET` = `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`
- ⚠️ `NEXT_PUBLIC_APP_URL` = `http://localhost:3000` (needs production URL in Vercel)

**OAuth Callback Routes:**
- ✅ `/api/oauth/google/authorize` - Initiates OAuth flow
- ✅ `/api/oauth/google/callback` - Handles OAuth response
- ✅ `/api/tenant/google-drive/status` - Check connection status
- ✅ `/api/tenant/google-drive/browse` - Browse Drive folders
- ✅ `/api/tenant/google-drive/transfer` - Transfer images
- ✅ `/api/tenant/google-drive/disconnect` - Remove connection

**UI Components:**
- ✅ `GoogleDriveConnection` - Shows status, connect/disconnect
- ✅ `GoogleDriveBrowser` - Visual folder navigation and file selection
- ❌ `OneDriveConnection` - Not implemented yet
- ❌ `OneDriveBrowser` - Not implemented yet

---

## Quick Test After Fix

Run this in browser console on `/admin/settings`:
```javascript
// Check if component is rendered
console.log('GoogleDrive section:', document.querySelector('[class*="GoogleDrive"]'))

// Check current URL config
console.log('App URL:', process.env.NEXT_PUBLIC_APP_URL)

// Check tenant data
fetch('/api/tenant/google-drive/status?tenant_id=YOUR_TENANT_ID')
  .then(r => r.json())
  .then(data => console.log('Drive Status:', data))
```

---

## Summary

**To Fix Immediately:**
1. Add both redirect URIs to Google Cloud Console
2. Set `NEXT_PUBLIC_APP_URL` in Vercel to production URL
3. Redeploy on Vercel
4. Test on production domain

**Current State:**
- ✅ Google Drive integration code is complete
- ✅ Admin UI exists and should be visible
- ❌ OAuth redirect URIs not configured correctly
- ❌ Production URL not set in Vercel

**After Fix:**
- Google Drive connection will work
- Can browse Drive folders in admin
- Can transfer images to Supabase Storage
- OneDrive still needs implementation (if desired)
