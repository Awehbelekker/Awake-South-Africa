# Supabase Database Migration Guide

## Overview

This guide walks you through migrating your Awake South Africa store from localStorage to Supabase for permanent, multi-device data storage.

## Prerequisites

- Supabase account (free tier available at [supabase.com](https://supabase.com))
- Your Supabase project URL and anon key
- Access to your Supabase project dashboard

## Step 1: Set Up Supabase Project

1. **Create a Supabase Project:**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Fill in the details:
     - Name: "Awake South Africa"
     - Database Password: (create a strong password and save it)
     - Region: Choose the closest to South Africa (e.g., "eu-west-1" or "ap-southeast-1")
   - Click "Create new project"
   - Wait ~2 minutes for the project to be provisioned

2. **Get Your Credentials:**
   - Once the project is ready, go to **Settings** → **API**
   - Copy the following:
     - **Project URL**: `https://your-project-id.supabase.co`
     - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 2: Create Database Tables

1. **Open SQL Editor:**
   - In your Supabase dashboard, go to **SQL Editor**
   - Click **New Query**

2. **Run the Migration Script:**
   - Copy the entire contents of `supabase-schema.sql` from the root directory
   - Paste it into the SQL Editor
   - Click **Run** or press Ctrl+Enter
   - You should see "Success. No rows returned"

3. **Verify Tables Created:**
   - Go to **Table Editor** in the Supabase dashboard
   - You should see these tables:
     - `products`
     - `demo_locations`
     - `cart_items`
     - `wishlist_items`
     - `store_settings`

## Step 3: Configure Environment Variables

###  Local Development

1. **Update `.env.local`:**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

   # Google Drive Configuration (existing)
   NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=your-client-id
   NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your-api-key
   NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID=your-app-id
   ```

2. **Restart Development Server:**
   ```bash
   npm run dev
   ```

### Production (Vercel)

1. **Add Environment Variables in Vercel:**
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add these variables:
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key-here`
   - Make sure they're set for all environments (Production, Preview, Development)

2. **Redeploy:**
   - Click **Deployments** → **Redeploy** on your latest deployment
   - Or push a new commit to trigger a deployment

## Step 4: Migrate Existing Data (Optional)

If you have existing data in localStorage that you want to keep:

### Option A: Manual Export/Import

1. **Export from localStorage:**
   - Open your site in the browser where you have data
   - Open Developer Console (F12)
   - Run this script:
   ```javascript
   // Export products
   const productsData = localStorage.getItem('products-storage');
   console.log('Products:', productsData);

   // Export demo locations
   const locationsData = localStorage.getItem('demo-locations-storage');
   console.log('Locations:', locationsData);

   // Copy the JSON data
   ```

2. **Import to Supabase:**
   - Go to **Table Editor** in Supabase
   - Select the appropriate table
   - Click **Insert** → **Insert row**
   - Or use the SQL Editor to bulk insert

### Option B: Use Admin Portal

Once Supabase is configured, you can re-enter your data through the admin portal:
- Products: `/admin/products`
- Demo Locations: `/admin/locations`

The system will automatically save to Supabase instead of localStorage.

## Step 5: Verify Migration

1. **Test Product Management:**
   - Go to `/admin/products`
   - Edit a product
   - Open the page in another browser/device
   - Verify the changes are visible everywhere

2. **Test Demo Locations:**
   - Go to `/admin/locations`
   - Update a location
   - Verify changes persist across sessions

3. **Check Database:**
   - Go to Supabase **Table Editor**
   - View the `products` and `demo_locations` tables
   - You should see your data there

## How It Works

### Hybrid Approach

The implementation uses a **hybrid fallback** approach:
- **If Supabase is configured:** Uses Supabase database
- **If not configured:** Falls back to localStorage

This means:
- ✅ No breaking changes if Supabase isn't set up
- ✅ Seamless migration path
- ✅ Development can continue with localStorage
- ✅ Production gets persistent storage

### Data Flow

```
User Action (Edit Product)
       ↓
Zustand Store
       ↓
Check if Supabase is configured?
       ├─ YES → Save to Supabase + Update local state
       └─ NO  → Save to localStorage only
```

## Row Level Security (RLS)

The database includes Row Level Security policies:

- **Products & Demo Locations:** Public read access, admin write access
- **Cart & Wishlist:** Session-based access (users can only see their own data)
- **Store Settings:** Public read, admin write

### Securing Admin Access

For production, you should:

1. **Enable Supabase Auth:**
   - Set up authentication in Supabase
   - Restrict admin operations to authenticated users

2. **Update RLS Policies:**
   ```sql
   -- Example: Restrict product editing to admin role
   CREATE POLICY "Only admins can edit products" ON products
       FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
   ```

## Troubleshooting

### "Supabase not configured" Message

- **Cause:** Environment variables not set
- **Fix:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local` or Vercel

### Data Not Persisting

- **Cause:** RLS policies blocking writes
- **Fix:** Check Supabase logs in the dashboard → **Logs** section

### "Failed to fetch" Errors

- **Cause:** CORS or network issues
- **Fix:** 
  - Verify your Project URL is correct
  - Check your anon key hasn't expired
  - Ensure RLS policies allow the operation

### Data Appears in Supabase but Not in App

- **Cause:** Cache issue
- **Fix:** Hard refresh browser (Ctrl+Shift+R) or clear cache

## Benefits of Supabase Migration

✅ **Permanent Storage:** Data persists even if browser cache is cleared  
✅ **Multi-Device Sync:** Access admin portal from any device  
✅ **Real-Time Updates:** Changes reflect immediately across all sessions  
✅ **Backup & Recovery:** Supabase automatically backs up your data  
✅ **Scalability:** Ready for multiple admins and high traffic  
✅ **Security:** Row Level Security protects your data  

## Next Steps

After Supabase migration is complete:

1. **Authentication:** Add proper admin authentication (Supabase Auth)
2. **User Accounts:** Enable customer accounts for order history
3. **Payment Integration:** Connect PayFast payment gateway
4. **Email Notifications:** Set up order confirmation emails
5. **Analytics:** Track sales and inventory

## Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Review browser console for error messages
3. Verify environment variables are set correctly
4. Check that the database schema was created successfully

---

**Migration Complete!** Your store now has a production-ready database backend. 🎉
