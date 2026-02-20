# 🚀 DEPLOYMENT CHECKLIST - Before Going Live

## ✅ Pre-Deployment Checklist

### 1. Database Setup (Supabase)

- [ ] **Run SQL Migration #1: Google Drive Columns**
  ```bash
  # In Supabase SQL Editor or terminal:
  # Copy/paste contents of: supabase/add-google-drive-to-tenants.sql
  ```
  **Verify:** Check tenants table has `google_drive_enabled`, `google_refresh_token`, `subdomain` columns

- [ ] **Create Storage Buckets**
  - [ ] Go to: Supabase Dashboard → Storage
  - [ ] Create bucket: `product-images` (Public: ✅)
  - [ ] Create bucket: `store-assets` (Public: ✅)

- [ ] **Run SQL Migration #2: Storage Policies**
  ```bash
  # In Supabase SQL Editor:
  # Copy/paste contents of: supabase/setup-storage-buckets.sql
  ```
  **Verify:** Check Storage → Policies shows INSERT/SELECT/UPDATE/DELETE policies for both buckets

---

### 2. Google Cloud Console Setup

- [ ] **Get Client Secret**
  1. Go to: https://console.cloud.google.com/apis/credentials
  2. Find OAuth Client ID: `39956410829-ihrhivfrsenidriv66896el6r9u1m8md`
  3. Click to view details
  4. Copy **Client Secret** value

- [ ] **Update Redirect URIs**
  - [ ] Add Development: `http://localhost:3000/api/oauth/google/callback`
  - [ ] Add Production: `https://your-domain.com/api/oauth/google/callback`
  - [ ] Save changes

- [ ] **Verify OAuth Consent Screen**
  - [ ] App Name: Set to your store name
  - [ ] Scopes include: 
    - `drive.readonly`
    - `drive.file`
    - `drive.metadata.readonly`

---

### 3. Environment Variables

#### Development (.env.local)
- [ ] `NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID` = `39956410829-ihrhivfrsenidriv66896el6r9u1m8md`
- [ ] `GOOGLE_DRIVE_CLIENT_SECRET` = `[paste from Google Console]`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://iepeffuszswxuwyqrzix.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `[your anon key]`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `[your service role key]`
- [ ] `NEXT_PUBLIC_APP_URL` = `http://localhost:3000`
- [ ] `MASTER_ADMIN_EMAIL` = `[your admin email]`
- [ ] `MASTER_ADMIN_PASSWORD_HASH` = `[SHA-256 hash of your password]`
- [ ] `MASTER_ADMIN_API_KEY` = `[random secure string]`

#### Production (Vercel Dashboard)
- [ ] Copy all variables from .env.local
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Keep secrets secure (never commit to git)

---

### 4. Local Testing

- [ ] **Test Google Drive OAuth**
  1. Run: `npm run dev`
  2. Visit: `http://localhost:3000/admin`
  3. Login with admin credentials
  4. Go to: `/admin/import`
  5. Click "Connect Google Drive"
  6. Accept permissions in Google popup
  7. Verify: Redirected back with "Connected" status

- [ ] **Test Drive Browser**
  1. On `/admin/import` page
  2. See "Browse Google Drive" section
  3. Navigate folders (click folder names)
  4. See breadcrumb navigation working
  5. See image thumbnails loading

- [ ] **Test Transfer to Supabase**
  1. Select 2-3 test images in Drive browser
  2. Check "Create product records"
  3. Choose category
  4. Click "Transfer to Supabase"
  5. Verify: Success message appears
  6. Check Supabase Storage: Files in `product-images/{tenant-id}/products/`
  7. Check products table: New records created

- [ ] **Test Direct Upload**
  1. On `/admin/import` page
  2. Scroll to "Direct Upload" section
  3. Drag image file from desktop
  4. Drop on upload zone
  5. Verify: Progress bar appears
  6. Verify: Success message with URL
  7. Check Supabase Storage: File uploaded

- [ ] **Test Master Admin Dashboard**
  1. Visit: `http://localhost:3000/master-admin/login`
  2. Login with MASTER_ADMIN credentials
  3. Verify: Tenant list shows real data
  4. Verify: Product counts displayed
  5. Verify: Google Drive status shown

---

### 5. Deployment to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

#### Option B: GitHub Integration
- [ ] Push code to GitHub
- [ ] Connect repo in Vercel dashboard
- [ ] Set environment variables in Vercel
- [ ] Deploy

---

### 6. Post-Deployment Verification

- [ ] **Test Production OAuth**
  1. Visit: `https://your-domain.com/admin`
  2. Connect Google Drive
  3. Verify: OAuth redirect works
  4. Verify: Callback returns to your domain

- [ ] **Test Production Storage**
  1. Upload test image
  2. Verify: URL is Supabase CDN
  3. Visit URL in browser
  4. Verify: Image loads correctly

- [ ] **Test Multi-Device Access**
  1. Login from phone
  2. Login from tablet
  3. Login from different computer
  4. Verify: All see same data
  5. Verify: Images accessible everywhere

---

### 7. Tenant Onboarding

#### Kelp (First Tenant)
- [ ] Send admin credentials
- [ ] Walk through Drive connection
- [ ] Import test products
- [ ] Verify only Kelp's products visible
- [ ] Test storefront at kelp subdomain

#### Off the Hook (Second Tenant)
- [ ] Send admin credentials
- [ ] Onboard with their Drive
- [ ] Verify tenant isolation
- [ ] Test their storefront

#### Aweh Be Lekker (Third Tenant)
- [ ] Same process
- [ ] Verify all tenants isolated

---

## 🔍 Troubleshooting Guide

### Issue: "Google Drive not connected"
**Cause:** SQL migration not run or OAuth token missing
**Fix:** Run `add-google-drive-to-tenants.sql` in Supabase

### Issue: "Failed to upload to Supabase"
**Cause:** Storage buckets not created or RLS policies missing
**Fix:** 
1. Create buckets in Supabase Dashboard
2. Run `setup-storage-buckets.sql`

### Issue: "Invalid client secret"
**Cause:** Wrong or missing GOOGLE_DRIVE_CLIENT_SECRET
**Fix:** Copy correct value from Google Console

### Issue: "Redirect URI mismatch"
**Cause:** Production URL not added to Google Console
**Fix:** Add `https://your-domain.com/api/oauth/google/callback`

### Issue: "Can't browse Drive folders"
**Cause:** Access token refresh failed
**Fix:** Disconnect and reconnect Google Drive

### Issue: "Images not showing"
**Cause:** Storage bucket not public
**Fix:** In Supabase Dashboard → Storage → bucket settings → Make public

---

## 📊 System Health Checks

### After Deployment, Verify:

**Database:**
- [ ] tenants table has 4 tenants
- [ ] products table has products
- [ ] Tenant IDs match in both tables

**Storage:**
- [ ] Buckets exist and are public
- [ ] RLS policies active
- [ ] Files organized by tenant folder

**OAuth:**
- [ ] Redirect URIs correct
- [ ] Client secret matches
- [ ] Scopes include drive.readonly

**Frontend:**
- [ ] /admin/import page loads
- [ ] Drive browser shows folders
- [ ] Direct upload accepts files
- [ ] Images display correctly

**Security:**
- [ ] Master admin password strong
- [ ] Service role key not exposed
- [ ] RLS policies enforce tenant isolation
- [ ] Storage folders separated by tenant

---

## 🎯 Success Criteria

**System is READY when:**
1. ✅ Tenant admin can login from any device
2. ✅ Drive browser navigates folders correctly
3. ✅ Images transfer from Drive to Supabase
4. ✅ Direct upload works from computer/phone
5. ✅ All images stored in Supabase cloud
6. ✅ Tenant isolation verified (no cross-tenant access)
7. ✅ Images accessible globally via CDN
8. ✅ Master admin sees all tenants

**Ready to onboard tenants! 🚀**

---

## 📝 Final Notes

### What's Working:
- ✅ Multi-tenant Supabase database
- ✅ Google Drive OAuth flow
- ✅ Drive folder browser
- ✅ Transfer from Drive → Supabase
- ✅ Direct file upload
- ✅ Supabase Storage with RLS
- ✅ Master admin dashboard
- ✅ Access from anywhere capability

### What's NOT Done Yet:
- ⚠️ Subdomain routing (optional)
- ⚠️ Custom domain mapping (optional)
- ⚠️ Medusa integration (optional)
- ⚠️ Payment processing setup (use existing)

### Priority: Deploy NOW
Focus on getting this version live. Enhancements can come later!

---

**Questions?** Check:
- `COMPLETE_IMAGE_MANAGEMENT_SYSTEM.md` - Technical details
- `TENANT_ADMIN_USER_GUIDE.md` - User instructions
- `GOOGLE_DRIVE_DEPLOYMENT_GUIDE.md` - OAuth setup
- `SYSTEM_COMPLETE_SUMMARY.md` - Full system overview
