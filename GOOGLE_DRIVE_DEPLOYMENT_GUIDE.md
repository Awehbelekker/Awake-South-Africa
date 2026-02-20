# 🚀 Deployment Guide: Multi-Tenant Platform with Google Drive

## Prerequisites Completed ✅

1. **Database**: Supabase PostgreSQL deployed
2. **Tenants**: 4 tenants created (Awake, Kelp, Off the Hook, Aweh Be Lekker)
3. **Products**: 92 products imported across tenants
4. **Google Drive OAuth**: Endpoints built and ready

## Remaining Setup Steps

### Step 1: Deploy Google Drive SQL Migration

Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/iepeffuszswxuwyqrzix/sql/new

```sql
-- Copy from: supabase/add-google-drive-to-tenants.sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_drive_enabled BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_client_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_client_secret TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_drive_last_sync TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain VARCHAR(50) UNIQUE;

UPDATE tenants SET subdomain = slug WHERE subdomain IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

UPDATE tenants SET subdomain = 'awake' WHERE slug = 'awake';
UPDATE tenants SET subdomain = 'kelp' WHERE slug = 'kelp';
UPDATE tenants SET subdomain = 'offthehook' WHERE slug = 'off-the-hook';
UPDATE tenants SET subdomain = 'aweh' WHERE slug = 'aweh-be-lekker';
```

### Step 2: Configure Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (if not already created)
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/oauth/google/callback` (for testing)
   - `https://yourdomain.com/api/oauth/google/callback` (production)
4. Copy Client Secret and add to environment variables

### Step 3: Environment Variables for Production

Add these to Vercel project settings or `.env.production`:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://iepeffuszswxuwyqrzix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Drive OAuth
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=39956410829-ihrhivfrsenidriv66896el6r9u1m8md.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=AIzaSyBPetVKEk-g6WE2irKJGxkY7M33PnYWB8c
NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID=39956410829
GOOGLE_DRIVE_CLIENT_SECRET=YOUR_ACTUAL_SECRET_HERE  # ⚠️ Get from Google Console

# Production URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # ⚠️ Update this!

# Medusa (optional - for full e-commerce)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://awake-south-africa-production.up.railway.app
```

### Step 4: Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Step 5: Configure Subdomain Routing (Optional)

**For multi-tenant subdomains** (kelp.yourdomain.com, offthehook.yourdomain.com):

1. Add wildcard DNS record: `*.yourdomain.com` → Vercel
2. Update middleware to detect subdomain
3. Each subdomain loads its tenant's products

**For separate domains** (kelpboards.co.za):

1. Each client keeps their repo/build
2. Set `NEXT_PUBLIC_TENANT_ID` in their environment
3. All connect to same Supabase database

---

## How Tenants Use the System

### Initial Setup (One-Time per Tenant)

1. **Admin logs in**: `/admin` → Enter credentials
2. **Connect Google Drive**:
   - Go to `/admin/settings` OR `/admin/import`
   - Click "Connect Drive"
   - Authorize Google account
   - Select folder with product images
3. **Import Products**:
   - Go to `/admin/import`
   - Click "Browse Drive Folder"
   - Select category
   - Click "Import X Products"
4. **Edit Product Details**:
   - Go to `/admin/products`
   - Edit names, prices, descriptions
   - Mark as "In Stock" when ready

### Ongoing Product Management

- **Add new products**: Upload to Drive → Click "Import" in admin
- **Update images**: Replace in Drive → Re-import
- **Edit details**: Use admin products page
- **View sales**: (Future: integrate with Medusa for orders)

---

## Architecture: How It All Connects

```
┌──────────────────────────────────────────────────────┐
│  SHARED SUPABASE DATABASE (Multi-Tenant)             │
│  ├── tenants table (with Google OAuth credentials)   │
│  ├── products table (tenant_id filter via RLS)       │
│  └── orders, customers, etc.                         │
└──────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   ┌─────────┐      ┌─────────┐    ┌──────────┐
   │ Awake   │      │  Kelp   │    │ Off the  │
   │ Repo    │      │ Repo    │    │  Hook    │
   │ (this)  │      │(separate)│   │  Repo    │
   └─────────┘      └─────────┘    └──────────┘
        ↓                ↓                ↓
   awakesa.com    kelpboards.com  offthehook.co.za
        │                │                │
        └────────────────┼────────────────┘
                         ↓
               Each tenant's Google Drive
               (auto-sync product images)
```

### Data Flow:

1. **Tenant connects Drive** → OAuth token stored in `tenants.google_refresh_token`
2. **Tenant imports** → API lists Drive files → Creates products with `tenant_id`
3. **Customer visits site** → RLS filters products by `tenant_id` → Only sees their store's products
4. **Orders placed** → Stored with `tenant_id` → Multi-tenant order management

---

## For Kelp Repo Integration

To connect Kelp's existing site to this shared database:

1. **Copy Supabase config** from this repo to Kelp repo
2. **Add environment variable**:
   ```bash
   NEXT_PUBLIC_TENANT_ID=48fd8da0-41e0-4c62-a898-71a45457c827  # Kelp's ID
   ```
3. **Update product queries** to filter by tenant:
   ```typescript
   const { data } = await supabase
     .from('products')
     .select('*')
     .eq('tenant_id', process.env.NEXT_PUBLIC_TENANT_ID)
   ```
4. **Add Google Drive OAuth** (copy from this repo):
   - `/api/oauth/google/authorize/route.ts`
   - `/api/oauth/google/callback/route.ts`
   - `/admin/import/page.tsx`

Same process for Off the Hook and Aweh Be Lekker!

---

## Next Steps Summary

1. ✅ **Run SQL migration** in Supabase (5 min)
2. ✅ **Add GOOGLE_DRIVE_CLIENT_SECRET** to environment (2 min)
3. ✅ **Update redirect URIs** in Google Console (3 min)
4. ✅ **Deploy to Vercel** (10 min)
5. ✅ **Test OAuth flow** (5 min)
6. ✅ **Import test products** from Drive (10 min)
7. ✅ **Share with clients** for onboarding

**Total time to production:** ~1 hour

---

## Support for Clients

When onboarding Kelp, Off the Hook, Aweh Be Lekker:

### 1. Give them admin access
- URL: `https://kelpboards.com/admin` (or their domain)
- Credentials: Set up for each client

### 2. Walk them through:
- Connect Google Drive (one-time setup)
- Import their first batch of products
- Edit product details
- Mark products "In Stock"

### 3. Ongoing:
- They manage products themselves
- Upload new images to Drive
- Click "Import" in admin
- All products auto-sync to their store

---

## Troubleshooting

### OAuth "redirect_uri_mismatch"
→ Add exact callback URL to Google Console

### "Google Drive not connected"
→ Check `google_refresh_token` in tenants table

### Products not showing
→ Verify `tenant_id` matches in products query

### Import fails
→ Check Drive folder permissions (tenant must own folder)

---

**Ready to deploy!** 🚀
