# 🚀 Vercel Deployment - Fix Permission Issue

## ✅ Social Media Links Updated

I've updated the social media links in the footer:
- **Instagram**: https://www.instagram.com/awake.southafrica
- **Facebook**: https://www.facebook.com/awake.southafrica2025
- **YouTube**: https://www.youtube.com/@awakeboards

## ⚠️ Vercel Deployment Issue

**Error**: `Git author awhbelekker@gmail.com must have access to the team RIchard's projects on Vercel`

This means the project is linked to a team account, but you're trying to deploy from your personal account.

## 🔧 Solution: Deploy to Your Personal Account

### Option 1: Remove Existing Link and Deploy Fresh

```powershell
# Remove the .vercel folder
Remove-Item -Recurse -Force .vercel

# Deploy to your personal account
vercel --prod
```

**What will happen:**
1. Vercel will ask: "Set up and deploy?" → Press **Enter** (Yes)
2. "Which scope?" → Select **your personal account** (not the team)
3. "Link to existing project?" → Select **No** (create new)
4. "What's your project's name?" → Type: `awake-boards-storefront`
5. "In which directory is your code located?" → Press **Enter**
6. Vercel will build and deploy!

### Option 2: Use Git Push to Deploy

This is the **easiest** method:

```powershell
# Go back to root directory
cd ..\..

# Stage all changes
git add .

# Commit changes
git commit -m "feat: Add real Awake product data and update social media links

- Updated all 44 products with real data from awakeboards.com
- Added rich text editor with preview/edit toggle mode
- Added real product images from Awake CDN
- Updated Instagram to @awake.southafrica
- Updated Facebook to @awake.southafrica2025
- Fixed all TypeScript errors"

# Push to GitHub
git push origin main
```

Then:
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `services/storefront` directory as the root
5. Click "Deploy"

### Option 3: Get Team Access

If you want to deploy to the team account:
1. Ask the team owner (Richard) to invite `awhbelekker@gmail.com` to the team
2. Accept the invitation
3. Then run `vercel --prod` again

## 🎯 Recommended: Use Git Push Method

This is the **safest and easiest** approach:

```powershell
# From storefront directory, go to root
cd ..\..

# Check what will be committed
git status

# Stage all changes
git add .

# Commit
git commit -m "feat: Add real Awake product data and update social media links"

# Push to GitHub
git push origin main
```

**Benefits:**
- ✅ Automatic deployment via Vercel
- ✅ Version control for all changes
- ✅ Easy rollback if needed
- ✅ No permission issues
- ✅ Deployment history tracked

## 📋 What's Ready to Deploy

### ✅ All Changes:
- 44 real products with Awake data
- Real images from Awake CDN
- Rich text editor with preview mode
- Array field editors
- Product edit modal with validation
- Toast notifications
- **Updated social media links**:
  - Instagram: @awake.southafrica
  - Facebook: @awake.southafrica2025

### ✅ Files Changed:
- `src/lib/constants.ts` - Product data + social media links
- `src/app/admin/products/page.tsx` - Admin dashboard
- `src/app/blog/page.tsx` - Fixed image reference
- `src/app/compare/page.tsx` - Fixed image references
- `src/components/admin/ProductEditModal.tsx` - New component
- `src/components/admin/RichTextEditor.tsx` - New component
- `src/components/admin/ArrayFieldEditor.tsx` - New component
- `src/lib/validation/productValidation.ts` - New validation
- `src/app/globals.css` - Tiptap styles

## 🚀 Deploy Now

**Recommended Command:**

```powershell
# Go to root
cd ..\..

# Commit and push
git add .
git commit -m "feat: Add real Awake product data and update social media links"
git push origin main
```

Then check https://vercel.com/dashboard for deployment status!

## ✅ After Deployment

Once deployed, verify:
1. **Homepage** - Check footer has correct social media links
2. **Products** - All 44 products display
3. **Admin** - Preview mode works
4. **Social Links** - Click Instagram/Facebook icons to verify they work

---

**Ready to deploy?** Use the Git push method above! 🚀

