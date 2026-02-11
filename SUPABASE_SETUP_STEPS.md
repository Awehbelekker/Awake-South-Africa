# 🚀 SUPABASE SETUP GUIDE
**Awake Store - Database Deployment**

## ✅ What We've Built (Session 13)

- ✅ Complete database schema (11 tables, 600+ lines SQL)
- ✅ Product Service with CRUD operations
- ✅ Order Service with payment workflow
- ✅ PayFast webhook integration
- ✅ Row Level Security policies
- ✅ Automated triggers and functions

**Now we need to deploy it!**

---

## 📋 Step 1: Create Supabase Project

### 1.1 Sign Up / Login
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (recommended) or email

### 1.2 Create New Project
1. Click "New Project"
2. Fill in details:
   - **Name:** `awake-store` or `awake-south-africa`
   - **Database Password:** Generate strong password (SAVE THIS!)
   - **Region:** Choose closest to South Africa (e.g., `Cape Town` or `eu-west-1`)
   - **Pricing Plan:** Free tier is fine for development

3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

---

## 📋 Step 2: Deploy Database Schema

### 2.1 Open SQL Editor
1. In your Supabase project, click **SQL Editor** in left sidebar
2. Click **+ New query**

### 2.2 Run Schema
1. Open `h:\Awake Store\supabase\schema.sql` in VS Code
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **Run** (or Ctrl+Enter)
5. Wait for completion (should see "Success. No rows returned" or similar)

### 2.3 Verify Tables Created
1. Click **Table Editor** in left sidebar
2. You should see 11 tables:
   - ✅ products
   - ✅ customers
   - ✅ addresses
   - ✅ orders
   - ✅ order_items
   - ✅ cart
   - ✅ wishlist
   - ✅ reviews
   - ✅ payment_transactions
   - ✅ admin_users
   - ✅ inventory_log

**If you see all 11 tables: SUCCESS! ✅**

---

## 📋 Step 3: Get Connection Credentials

### 3.1 Get Project URL and Keys
1. Click **Settings** (gear icon) in sidebar
2. Click **API** section
3. Copy these values:

```
Project URL: https://[your-project-ref].supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (keep secret!)
```

### 3.2 Get Database URL
1. Still in **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with the password you created

```
postgresql://postgres:[YOUR-PASSWORD]@db.[your-project-ref].supabase.co:5432/postgres
```

---

## 📋 Step 4: Configure Environment Variables

### 4.1 Update Local Environment
1. Open `h:\Awake Store\.env.local`
2. Update these values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-role-key...
DATABASE_URL=postgresql://postgres:[password]@db.[your-project-ref].supabase.co:5432/postgres

# PayFast Configuration (if you have credentials)
NEXT_PUBLIC_PAYFAST_MERCHANT_ID=your-merchant-id
NEXT_PUBLIC_PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-passphrase
NEXT_PUBLIC_PAYFAST_MODE=sandbox  # Change to 'live' for production

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000/admin
```

### 4.2 Update Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your project: **awake-south-africa**
3. Go to **Settings** → **Environment Variables**
4. Add the same variables as above
5. Make sure to select **Production**, **Preview**, and **Development** for each
6. Click **Save**

---

## 📋 Step 5: Migrate Product Data

### Option A: Run Migration Script (Recommended)

Create and run this script:

```bash
# In PowerShell
cd "H:\Awake Store"
node scripts/migrate-products-to-supabase.js
```

### Option B: Manual SQL Import

We can create an SQL file from your existing products in `constants.ts`:

1. Extract all 44 products
2. Convert to INSERT statements
3. Run in Supabase SQL Editor

**Would you like me to create the migration script?**

---

## 📋 Step 6: Test Database Connection

### 6.1 Test Locally
```bash
# In PowerShell
cd "H:\Awake Store"
npm run dev
```

Visit http://localhost:3000 and check browser console for any Supabase errors.

### 6.2 Test Product Queries
1. Open browser DevTools (F12)
2. Go to Console tab
3. Products should load from Supabase (if migrated) or fall back to localStorage

---

## 📋 Step 7: Enable Supabase Features

### 7.1 Enable Email Auth (for customer accounts)
1. Go to **Authentication** in Supabase dashboard
2. Click **Providers**
3. Enable **Email** provider
4. Configure email templates (optional)

### 7.2 Set Up Storage (for product images)
1. Go to **Storage** in Supabase dashboard
2. Click **Create bucket**
3. Name it `products` or `product-images`
4. Set policy to **Public** (for product images)

---

## 📋 Step 8: Set Up RLS Policies

Row Level Security is already configured in the schema, but verify:

1. Go to **Table Editor**
2. Select any table (e.g., `products`)
3. Click **RLS Policies** tab
4. You should see policies like "Public can view published products"

---

## 🔍 Troubleshooting

### Issue: "Invalid API key"
- Check that you copied the full anon key from Supabase
- Verify no extra spaces in .env.local
- Restart dev server after changing .env files

### Issue: "Table does not exist"
- Run the schema.sql again in SQL Editor
- Check for any errors in the SQL execution
- Verify all 11 tables appear in Table Editor

### Issue: "No rows returned"
- This is normal if you haven't migrated product data yet
- App will fall back to localStorage data

### Issue: "Connection timeout"
- Check your internet connection
- Verify Supabase project URL is correct
- Check Supabase status page: https://status.supabase.com

---

## ✅ Success Checklist

Before moving to next steps, verify:

- [ ] Supabase project created
- [ ] All 11 tables visible in Table Editor
- [ ] Environment variables configured locally
- [ ] Environment variables configured in Vercel
- [ ] Local dev server connects to Supabase
- [ ] No console errors related to Supabase
- [ ] Products load (from localStorage initially)

---

## 🎯 Next Steps After Setup

1. **Migrate Products** - Move 44 products from constants.ts to Supabase
2. **Test Order Creation** - Create test order in database
3. **Test PayFast Webhook** - Verify payment notifications work
4. **Deploy to Vercel** - Push changes and verify production works
5. **Set Up Customer Auth** - Enable user registration/login
6. **Add Email Notifications** - Order confirmations

---

## 📞 Need Help?

If you encounter issues:
1. Check Supabase dashboard logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test connection with a simple query in SQL Editor

---

**Estimated Time: 15-20 minutes**

**Status:**
- ✅ Schema created (Session 13)
- ⏸️ Waiting for Supabase project setup
- ⏸️ Waiting for environment configuration
- ⏸️ Waiting for data migration

**Last Updated:** February 11, 2026
