# 🚨 URGENT: Fix Vercel 404 Error NOW

## The Problem
Your Vercel deployment is returning **404: NOT_FOUND** because Vercel doesn't know your Next.js app is in `services/storefront`.

## The Solution (2 Options)

---

## ✅ **OPTION 1: Configure Vercel Dashboard (RECOMMENDED)**

### Step 1: Open Vercel Project Settings
1. Go to: https://vercel.com/dashboard
2. Click on your **Awake Boards SA** project
3. Click **Settings** (top navigation)
4. Click **General** (left sidebar)

### Step 2: Set Root Directory
Scroll down to find **"Root Directory"** section:

```
┌─────────────────────────────────────────┐
│ Root Directory                          │
├─────────────────────────────────────────┤
│ By default, your project's source code │
│ is expected to be at the root of your  │
│ repository.                             │
│                                         │
│ [Edit] ← CLICK THIS                     │
│                                         │
│ Current: ./                             │
└─────────────────────────────────────────┘
```

**Click "Edit"** and enter:
```
services/storefront
```

**Click "Save"**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots menu)
4. Click **"Redeploy"**
5. Wait 2-3 minutes

### Step 4: Test
Visit your site - it should work!

---

## ⚡ **OPTION 2: Delete Root vercel.json (Alternative)**

If Option 1 doesn't work, try this:

### Step 1: Remove Root vercel.json
The root `vercel.json` might be confusing Vercel. Let's remove it:

```bash
# In your terminal
git rm vercel.json
git commit -m "remove: Delete root vercel.json - using Vercel dashboard config instead"
git push origin main
```

### Step 2: Ensure Root Directory is Set
Make sure in Vercel Dashboard → Settings → General:
- **Root Directory**: `services/storefront`

### Step 3: Redeploy
Vercel will auto-deploy after the push.

---

## 🔍 **How to Check If Root Directory Is Set**

In Vercel Dashboard → Settings → General, you should see:

```
Root Directory: services/storefront
```

If it says `./` or is empty, **you MUST change it to `services/storefront`**.

---

## 📊 **What's Happening Behind the Scenes**

### ❌ Current (Broken) Setup:
```
Repository Root (/)
├── vercel.json          ← Vercel looks here
├── services/
│   └── storefront/
│       ├── package.json  ← Your Next.js app is here
│       ├── next.config.js
│       └── src/
└── (Vercel can't find Next.js app = 404)
```

### ✅ After Setting Root Directory:
```
Repository Root (/)
├── services/
│   └── storefront/      ← Vercel looks here now!
│       ├── package.json  ← Found!
│       ├── next.config.js
│       └── src/
└── (Vercel builds successfully!)
```

---

## 🎯 **Expected Results**

After setting Root Directory and redeploying:

✅ Homepage loads with hero image  
✅ `/products` page works  
✅ `/products/ravik-explore` works  
✅ All product pages load  
✅ No more 404 errors  

---

## 🆘 **Still Getting 404?**

If you've set Root Directory and still see 404:

### Check Build Logs:
1. Vercel Dashboard → Deployments
2. Click on latest deployment
3. Click **"Building"** or **"View Function Logs"**
4. Look for errors

### Common Issues:
- Root Directory not saved properly → Re-save it
- Old deployment cached → Force redeploy
- vercel.json conflicting → Delete it (Option 2)

---

## 📞 **Quick Checklist**

- [ ] Opened Vercel Dashboard
- [ ] Went to Settings → General
- [ ] Set Root Directory to `services/storefront`
- [ ] Clicked Save
- [ ] Redeployed latest commit
- [ ] Waited 2-3 minutes
- [ ] Tested site - works!

---

## 💡 **Why This Happens**

Vercel's auto-detection works for:
- Next.js at repository root: `package.json` in `/`

But your project has:
- Next.js in subdirectory: `package.json` in `/services/storefront/`

**Solution**: Tell Vercel where to look via Root Directory setting.

---

**Set the Root Directory NOW and your site will work!** 🚀

If you need help, share:
1. Your Vercel project URL
2. Screenshot of Settings → General page
3. Latest deployment logs

