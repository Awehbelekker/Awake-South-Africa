# Multi-Tenant Frontend Architecture Guide

## Current System Status
- ✅ **Backend**: Supabase PostgreSQL with RLS (Row-Level Security)
- ✅ **Multi-tenant isolation**: Each tenant has their own products
- ✅ **Tenants created**: Awake (86 products), Kelp (3), Off the Hook (3), Aweh Be Lekker (0)
- ✅ **API**: `/api/tenant` endpoint for tenant detection

## Architecture Options for Client Sites

### **Option 1: Subdomain Routing (Single Codebase)** ⭐ RECOMMENDED FOR MVP
**URL Structure:**
- `awake.yourdomain.com` → Awake Boards SA
- `kelp.yourdomain.com` → Kelp Boards
- `offthehook.yourdomain.com` → Off the Hook

**How it Works:**
```
User visits kelp.yourdomain.com
    ↓
Middleware detects subdomain = "kelp"
    ↓
/api/tenant returns Kelp tenant config
    ↓
TenantContext loads Kelp branding
    ↓
useSupabaseProducts fetches Kelp's 3 products
    ↓
Same Next.js app, different data/branding
```

**Pros:**
- ✅ Single codebase to maintain
- ✅ One deployment, all clients updated
- ✅ Shared features automatically available to all
- ✅ Easy to add new tenants

**Cons:**
- ❌ All clients must use same design/structure
- ❌ Limited customization per client
- ❌ Shared Next.js app bundle

**Setup:**
1. Configure DNS: CNAME records for each subdomain
2. Update `src/middleware.ts` to detect subdomain
3. Deploy to Vercel with wildcard domain support

---

### **Option 2: Separate Frontend Repos (White-Label)** ⭐ FOR FULL CUSTOMIZATION
**URL Structure:**
- `awakesa.co.za` → Awake custom site (this repo)
- `kelpboards.co.za` → Kelp custom site (separate repo)
- `offthehook.co.za` → Off the Hook custom site (separate repo)

**How it Works:**
```
Each client gets:
1. Their own Next.js repo (forked/cloned from base)
2. Their own Vercel deployment
3. Custom branding, layouts, features
4. ALL connect to SAME Supabase backend
```

**Shared Configuration:**
Every client site has:
```js
// .env.local
NEXT_PUBLIC_SUPABASE_URL=https://iepeffuszswxuwyqrzix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same-key>
NEXT_PUBLIC_TENANT_ID=48fd8da0-41e0-4c62-a898-71a45457c827  // Kelp's ID
```

**Product Fetching:**
```typescript
// Each client hardcodes their tenant ID
const TENANT_ID = '48fd8da0-41e0-4c62-a898-71a45457c827' // Kelp

const { data } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', TENANT_ID)  // Only fetches Kelp's products
```

**Pros:**
- ✅ Full design customization per client
- ✅ Independent deployment schedules
- ✅ Client-specific features without affecting others
- ✅ Can use different tech stacks if needed

**Cons:**
- ❌ Multiple codebases to maintain
- ❌ Features must be manually copied across repos
- ❌ More deployment complexity

**Setup for Each Client:**
1. Clone base repo (this one)
2. Update `.env.local` with client's `TENANT_ID`
3. Customize branding, colors, layouts
4. Deploy to Vercel/Netlify with client's domain
5. All share same Supabase database

---

### **Option 3: Hybrid Approach** ⭐ BEST OF BOTH WORLDS
**URL Structure:**
- `awake.platform.com` → Awake on shared platform
- `kelp.platform.com` → Kelp on shared platform
- `customkelp.co.za` → Kelp's premium custom site (separate repo)

**When to Use:**
- Start with Option 1 for quick client onboarding
- Upgrade specific clients to Option 2 when they need more control
- Keep simple clients on shared platform

---

## How Kelp Repo Fits In

Based on your mention of the Kelp repo, here's the integration plan:

### **Scenario A: Kelp Repo as Standalone Site**
```
Kelp Repository (separate)
    ↓
Uses same Supabase credentials
    ↓
Fetches products WHERE tenant_id = 'kelp-id'
    ↓
Custom Kelp design/branding
    ↓
Deploys to kelpboards.co.za
```

**Integration Steps:**
1. Copy Supabase config from this repo to Kelp repo
2. Update Kelp's product fetching to use tenant filter
3. Set `NEXT_PUBLIC_TENANT_ID` in Kelp's environment
4. Both sites share same database, different products

### **Scenario B: Kelp Repo Merged Into This One**
```
Awake Store (this repo)
    ├─ /app/(awake)/... → Awake routes
    ├─ /app/(kelp)/... → Kelp-specific routes
    └─ Middleware routes by subdomain
```

**Integration Steps:**
1. Create route groups for tenant-specific pages
2. Use middleware to route subdomain to correct group
3. Share components but allow overrides per tenant

---

## Database Architecture (Already Built) ✅

```sql
-- Each product has tenant_id
products
  ├─ id (UUID)
  ├─ tenant_id (UUID) → links to tenants table
  ├─ name, price, category, etc.
  └─ RLS Policy: Users see only their tenant's products

tenants
  ├─ id (UUID)
  ├─ slug (text) → 'awake', 'kelp', 'off-the-hook'
  ├─ name (text)
  ├─ domain (text) → custom domain
  └─ branding (colors, logo, etc.)
```

**RLS Policies Enforce Isolation:**
```sql
-- Users can only see products for their tenant
CREATE POLICY "tenant_isolation" ON products
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

This means even if someone tries to hack the API, they can't see other tenants' products.

---

## Recommended Implementation Path

### **Phase 1: Localhost Development (Current)** ✅
- Single repo, hardcoded Awake tenant
- Products loading from Supabase
- Admin panel for management

### **Phase 2: Add Subdomain Support** (1-2 days)
- Update middleware to detect subdomain
- Test: `kelp.localhost:3000` shows Kelp's 3 products
- Deploy to Vercel with wildcard domain

### **Phase 3: Custom Client Sites** (per client)
- Clone repo for clients needing custom design
- Set their `TENANT_ID` in environment
- Deploy to their custom domain
- All connect to same Supabase

### **Phase 4: Admin Management** (future)
- Master admin can create new tenants
- Each tenant gets admin portal
- Self-service product management

---

## Questions to Decide

1. **Will all clients have similar designs?**
   - Yes → Use Option 1 (subdomain routing)
   - No → Use Option 2 (separate repos)

2. **How much control do clients need?**
   - Just products/content → Option 1
   - Full customization → Option 2

3. **What's the Kelp repo for?**
   - If it's a test/prototype → merge it into this one
   - If it's production-ready → keep separate, connect to same Supabase

4. **Deployment preference?**
   - One deployment for all → Option 1
   - Each client managed separately → Option 2

---

## Next Steps

**Let me know:**
1. Should we use subdomain routing (Option 1) or separate repos (Option 2)?
2. Is the Kelp repo meant to be standalone or merged?
3. Do all clients need similar storefronts or completely custom designs?

**Then I can:**
- Set up the chosen architecture
- Configure subdomain routing if Option 1
- Create deployment guide for separate sites if Option 2
- Integrate Kelp repo appropriately
