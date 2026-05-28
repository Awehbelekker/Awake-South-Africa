# Product Storage Migration Guide

## Current Situation

Your system has:
- ✅ **44 products** in browser localStorage (working)
- ⚠️ **Medusa backend** online but empty (no products)
- ⏳ **Supabase** ready but not connected

## Quick Solution Options

### Option 1: Export & Import (Easiest - 5 minutes)

**Step 1: Export your products**
1. Open your site: http://localhost:3000 (or deployed URL)
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Paste this command and press Enter:
   ```javascript
   copy(JSON.stringify(JSON.parse(localStorage.getItem('products-storage')).state.products, null, 2))
   ```
5. Your products are now copied to clipboard!

**Step 2: Save to a file**
1. Open Notepad or VS Code
2. Paste (Ctrl+V)
3. Save as: `h:\Awake Store\local-products-backup.json`

**Step 3: Migrate to Medusa**
```powershell
cd "h:\Awake Store"

# Add admin credentials to .env.local
# MEDUSA_ADMIN_EMAIL=your-email@example. com
# MEDUSA_ADMIN_PASSWORD=your-password

# Run migration script
npx tsx scripts/migrate-local-to-medusa.ts
```

---

### Option 2: Use Supabase Instead (Recommended for long-term)

**Why Supabase?**
- ✅ Easier setup than Medusa
- ✅ Your data schema is already ready
- ✅ Better for multi-tenant architecture
- ✅ Free tier available

**Setup (15 minutes):**

1. **Create Supabase Project**
   - Go to: https://supabase.com
   - Click "New Project"
   - Name: "Awake Store"
   - Region: Closest to South Africa
   - Wait 2 minutes for setup

2. **Run Database Schema**
   ```sql
   -- Copy contents from: h:\Awake Store\supabase\schema.sql
   -- Paste into Supabase SQL Editor
   -- Click "Run"
   ```

3. **Add to .env.local**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

4. **Migrate products**
   ```powershell
   npx tsx scripts/migrate-products.ts
   ```

---

### Option 3: Keep Using LocalStorage (Works but limited)

**Current behavior:**
- ✅ Works offline
- ✅ Fast performance
- ❌ Only on one device/browser
- ❌ Lost if you clear browser data
- ❌ Limited to ~5MB storage

**This is fine for:**
- Testing
- Single-user admin
- Temporary solution

**To continue:**
- Just keep using the site as-is
- Products are safe in localStorage
- Admin dashboard works normally

---

## Recommended Path

### For Production (Choose ONE):

1. **Supabase** (Easiest)
   - 15 min setup
   - Free tier
   - Your schema ready
   - ✅ Recommended

2. **Medusa** (Most features)
   - Need admin user setup
   - More complex
   - Better for large catalog
   - Consider if scaling

3. **Both** (Best of both worlds)
   - Medusa for e-commerce
   - Supabase for multi-tenant data
   - More maintenance

---

## Quick: Export Your 44 Products NOW (Safety Backup)

**In browser console (F12), run:**

```javascript
// Export to file download
const products = JSON.parse(localStorage.getItem('products-storage')).state.products
const blob = new Blob([JSON.stringify(products, null, 2)], {type: 'application/json'})
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'awake-products-backup-' + new Date().toISOString().split('T')[0] + '.json'
a.click()
```

This will download: `awake-products-backup-2026-02-18.json`

---

## Need Help?

**Check Medusa Status:**
```powershell
Invoke-WebRequest -Uri "https://awake-south-africa-production.up.railway.app/health"
```

**Check what's in localStorage:**
```javascript
// In browser console
JSON.parse(localStorage.getItem('products-storage')).state.products.length
// Should show: 44
```

**Start fresh:**
```javascript
// Reset to default products
localStorage.removeItem('products-storage')
location.reload()
```

---

## What You Have

| Storage | Products | Status | Cross-Device | Persistent |
|---------|----------|--------|--------------|------------|
| **LocalStorage** | 44 | ✅ Working | ❌ No | ❌ No |
| **Medusa** | 0 | 🟡 Ready | ✅ Yes | ✅ Yes |
| **Supabase** | 0 | 🟡 Ready | ✅ Yes | ✅ Yes |

**Your choice:** Pick one backend and migrate! 🚀
