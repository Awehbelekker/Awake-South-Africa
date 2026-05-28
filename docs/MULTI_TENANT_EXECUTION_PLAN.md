# 🎯 Multi-Tenant Platform - Systematic Execution Plan

**Date:** February 18, 2026  
**Goal:** Get 3 tenants live with proper data isolation  
**Supabase:** https://supabase.com/dashboard/project/iepeffuszswxuwyqrzix

---

## 🏢 YOUR TENANTS

| # | Business Name | Type | Products | Status |
|---|--------------|------|----------|--------|
| 1 | **Awake Boards SA** | eFoils & Jetboards | 44 | In localStorage |
| 2 | **Kelp** | [Your client] | TBD | Not onboarded |
| 3 | **Off the Hook** | [Your client] | TBD | Not onboarded |
| 4 | **Aweh Be Lekker** | Your business | TBD | Not onboarded |

---

## ✅ PHASE 1: FOUNDATION (TODAY - 2 hours)

### Step 1.1: Get Supabase Credentials ⏳
**Location:** https://supabase.com/dashboard/project/iepeffuszswxuwyqrzix

```bash
# Navigate to: Project Settings → API
# Copy these 3 values:

1. Project URL: https://iepeffuszswxuwyqrzix.supabase.co
2. anon/public key: eyJhbG... (long string)
3. service_role key: eyJhbG... (long string, KEEP SECRET)
```

**Action:**
- [ ] Get Project URL
- [ ] Get anon key
- [ ] Get service_role key
- [ ] Save to `.env.local`

---

### Step 1.2: Update Environment Variables ⏳

**File:** `.env.local`

Add these lines:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://iepeffuszswxuwyqrzix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Multi-Tenant Configuration
NEXT_PUBLIC_ENABLE_MULTI_TENANT=true
```

**Action:**
- [ ] Add Supabase URL
- [ ] Add anon key
- [ ] Add service role key
- [ ] Enable multi-tenant flag

---

### Step 1.3: Deploy Database Schema ⏳

**Location:** Supabase Dashboard → SQL Editor

**Action:**
```bash
# 1. Open SQL Editor in Supabase
# 2. Create new query
# 3. Copy ENTIRE contents of: h:\Awake Store\supabase\schema.sql
# 4. Run the query
# 5. Verify tables created
```

**Expected Tables:**
- [ ] `tenants` (business accounts)
- [ ] `products` (multi-tenant products)
- [ ] `customers` (multi-tenant customers)
- [ ] `orders` (multi-tenant orders)
- [ ] `addresses` (multi-tenant addresses)
- [ ] `payments` (payment records)
- [ ] `carts` (shopping carts)
- [ ] `cloud_storage_configs` (media settings)

**Verification:**
```sql
-- Run this to verify
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

### Step 1.4: Create Tenant Records ⏳

**Location:** Supabase Dashboard → Table Editor → `tenants` table

**Option A: Manual (Quick):**
```sql
-- Run in SQL Editor
INSERT INTO tenants (name, slug, domain, settings) VALUES
('Awake Boards SA', 'awake-boards', 'awake-south-africa.vercel.app', '{
  "currency": "ZAR",
  "timezone": "Africa/Johannesburg",
  "theme": {"primaryColor": "#000000", "logo": "/images/awake-logo.png"}
}'),
('Kelp', 'kelp', NULL, '{
  "currency": "ZAR",
  "timezone": "Africa/Johannesburg"
}'),
('Off the Hook', 'off-the-hook', NULL, '{
  "currency": "ZAR",
  "timezone": "Africa/Johannesburg"
}'),
('Aweh Be Lekker', 'aweh-be-lekker', NULL, '{
  "currency": "ZAR",
  "timezone": "Africa/Johannesburg"
}');

-- Get tenant IDs
SELECT id, name, slug FROM tenants ORDER BY created_at;
```

**Action:**
- [ ] Run SQL to create tenants
- [ ] Copy tenant IDs (save for next step)
- [ ] Verify 4 tenants created

**Save These IDs:**
```
Awake Boards SA: 00000000-0000-0000-0000-000000000000
Kelp:           00000000-0000-0000-0000-000000000000
Off the Hook:   00000000-0000-0000-0000-000000000000
Aweh Be Lekker: 00000000-0000-0000-0000-000000000000
```

---

## ✅ PHASE 2: MIGRATE AWAKE PRODUCTS (TODAY - 1 hour)

### Step 2.1: Export Products from Browser ⏳

**Tool:** `h:\Awake Store\scripts\export-products-from-browser.html`

**Action:**
```bash
# 1. Open Chrome/Edge
# 2. Navigate to: http://localhost:3000/admin/products
#    (or your live site if running)
# 3. Open Developer Tools (F12)
# 4. Go to Console tab
# 5. Run: localStorage.getItem('products-storage')
# 6. Copy the output
# 7. Save as: products-backup-2026-02-18.json
```

**Alternative:**
```bash
# Use the HTML tool
# 1. Open: scripts/export-products-from-browser.html in browser
# 2. Click "Export Products"
# 3. Save JSON file
```

**Action:**
- [ ] Export 44 products from browser
- [ ] Save as `products-backup-2026-02-18.json`
- [ ] Verify file contains 44 products

---

### Step 2.2: Run Migration Script ⏳

**Command:**
```powershell
# Navigate to project root
cd "h:\Awake Store"

# Install TypeScript runner (if needed)
npm install -D tsx

# Run migration to Supabase
npx tsx scripts/migrate-products.ts products-backup-2026-02-18.json
```

**The script will:**
1. ✅ Read your exported JSON
2. ✅ Connect to Supabase
3. ✅ Ask which tenant (select "Awake Boards SA")
4. ✅ Migrate all 44 products
5. ✅ Show success/error for each product

**Action:**
- [ ] Run migration script
- [ ] Select "Awake Boards SA" tenant
- [ ] Verify 44 products migrated
- [ ] Fix any errors

**Verification:**
```sql
-- Run in Supabase SQL Editor
SELECT 
  t.name as tenant,
  COUNT(p.id) as product_count
FROM tenants t
LEFT JOIN products p ON p.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY t.name;
```

**Expected Result:**
```
tenant              | product_count
--------------------+--------------
Awake Boards SA     | 44
Kelp                | 0
Off the Hook        | 0
Aweh Be Lekker      | 0
```

---

## ✅ PHASE 3: UPDATE APPLICATION (TODAY - 1 hour)

### Step 3.1: Update Product Store ⏳

The app needs to load from Supabase instead of localStorage.

**Files to update:**
1. `src/app/admin/products/page.tsx` - Admin product list
2. `src/app/products/page.tsx` - Storefront product list
3. `src/app/products/[id]/page.tsx` - Product detail page

**Action:**
- [ ] Update admin to load from Supabase
- [ ] Update storefront to load from Supabase
- [ ] Add tenant filtering
- [ ] Test loading

---

### Step 3.2: Test Multi-Tenant Isolation ⏳

**Verification Steps:**

```sql
-- 1. Test tenant isolation
-- Try to access another tenant's products (should fail with RLS)
SET request.jwt.claims TO '{"tenant_id": "WRONG_TENANT_ID"}';
SELECT * FROM products WHERE tenant_id = 'AWAKE_TENANT_ID';
-- Should return empty (RLS blocks it)

-- 2. Test correct access
SET request.jwt.claims TO '{"tenant_id": "AWAKE_TENANT_ID"}';
SELECT COUNT(*) FROM products;
-- Should return 44

-- 3. Verify data isolation
SELECT 
  tenant_id,
  COUNT(*) as product_count,
  SUM(price) as total_value
FROM products
GROUP BY tenant_id;
```

**Action:**
- [ ] Test RLS policies work
- [ ] Verify tenant isolation
- [ ] Test product CRUD operations
- [ ] Ensure no data leakage

---

## ✅ PHASE 4: TENANT SWITCHING UI (TOMORROW - 4 hours)

### Step 4.1: Create Tenant Context ⏳

**File:** `src/lib/context/TenantContext.tsx`

**Features:**
- Tenant selector dropdown
- Switch between tenants
- Persist selected tenant
- Filter all data by tenant

**Action:**
- [ ] Create tenant context
- [ ] Add tenant switcher to admin nav
- [ ] Persist selection in localStorage
- [ ] Update all queries to filter by tenant

---

### Step 4.2: Build Tenant Management UI ⏳

**File:** `src/app/admin/tenants/page.tsx`

**Features:**
- List all tenants
- Create new tenant
- Edit tenant settings
- View tenant statistics
- Activate/deactivate tenants

**Action:**
- [ ] Create tenant management page
- [ ] Add CRUD operations
- [ ] Show statistics per tenant
- [ ] Add tenant onboarding flow

---

## ✅ PHASE 5: ONBOARD NEXT TENANT (THIS WEEK)

### Step 5.1: Kelp Onboarding ⏳

**Checklist:**
- [ ] Get Kelp product data (CSV/spreadsheet)
- [ ] Import products to Supabase with Kelp tenant_id
- [ ] Configure Kelp branding (logo, colors)
- [ ] Set up Kelp payment gateway
- [ ] Test Kelp store independently
- [ ] Get Kelp approval
- [ ] Go live

### Step 5.2: Off the Hook Onboarding ⏳

Same process as Kelp.

### Step 5.3: Aweh Be Lekker Onboarding ⏳

Same process as Kelp.

---

## 📊 SUCCESS METRICS

### Technical Metrics
- [ ] All 3 tenants have isolated data
- [ ] RLS policies prevent cross-tenant access
- [ ] Each tenant has unique branding
- [ ] Each tenant has custom domain (optional)
- [ ] Products load in < 500ms
- [ ] Admin UI responds in < 200ms

### Business Metrics
- [ ] Awake Boards SA: 44 products live
- [ ] Kelp: X products live
- [ ] Off the Hook: Y products live
- [ ] Aweh Be Lekker: Z products live
- [ ] All tenants can place orders
- [ ] All tenants can process payments

---

## 🚨 POTENTIAL ISSUES & SOLUTIONS

### Issue 1: RLS Not Working
**Symptom:** Can see other tenant's data
**Solution:** 
```sql
-- Force enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

### Issue 2: Migration Fails
**Symptom:** Products not importing
**Solution:**
1. Check Supabase connection
2. Verify tenant_id exists
3. Check product data format
4. Run migration with --verbose flag

### Issue 3: Slow Queries
**Symptom:** Products load slowly
**Solution:**
```sql
-- Add indexes
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
```

---

## 📅 TIMELINE

### Today (Feb 18)
- ⏰ 2 hours: Configure Supabase + Deploy Schema
- ⏰ 1 hour: Migrate Awake products
- ⏰ 1 hour: Update app to use Supabase

### Tomorrow (Feb 19)
- ⏰ 4 hours: Build tenant switching UI
- ⏰ 2 hours: Test multi-tenant isolation

### This Week (Feb 20-23)
- ⏰ Day 3: Onboard Kelp
- ⏰ Day 4: Onboard Off the Hook
- ⏰ Day 5: Onboard Aweh Be Lekker

### Result:
**4 tenants live by end of week!** 🎉

---

## 🎯 NEXT STEPS AFTER PHASE 5

### Phase 6: Advanced Features (Next 2 weeks)
- [ ] AI Smart Scan for product imports
- [ ] Calendar integration
- [ ] CogniCore invoicing
- [ ] Automated workflows (n8n)
- [ ] Analytics dashboard
- [ ] Tenant billing system

### Phase 7: Scale (2-3 months)
- [ ] Custom domains per tenant
- [ ] White-label mobile apps
- [ ] Advanced reporting
- [ ] Multi-currency support
- [ ] International shipping
- [ ] Scale to 20+ tenants

### Phase 8: Market (6 months)
- [ ] Public tenant signup
- [ ] Self-service onboarding
- [ ] Stripe subscription billing
- [ ] Referral program
- [ ] Scale to 100 tenants

---

## ✅ READY TO START?

**Your immediate next step:**

```bash
# 1. Get Supabase credentials from dashboard
https://supabase.com/dashboard/project/iepeffuszswxuwyqrzix/settings/api

# 2. Update .env.local with the keys

# 3. Run schema in SQL Editor
# Copy: h:\Awake Store\supabase\schema.sql

# 4. Tell me when done, I'll guide next step
```

---

**Let's do this systematically! 🚀**

Start with Step 1.1 and report back when you have the Supabase credentials.
