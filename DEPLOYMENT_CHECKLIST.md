# 🚀 Deployment Checklist

## Pre-Deployment Checks

### 1. Local Testing ✅
- [ ] Dev server runs without errors (`npm run dev`)
- [ ] All 44 products display correctly
- [ ] Admin dashboard loads at `/admin/products`
- [ ] Preview mode works in rich text editor
- [ ] Array field editors work (add, remove, reorder)
- [ ] Product edit modal opens and saves
- [ ] Toast notifications appear
- [ ] Validation prevents bad data
- [ ] No console errors in browser

### 2. Code Quality ✅
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint warnings
- [ ] All imports are correct
- [ ] No unused variables or functions
- [ ] Code is properly formatted

### 3. Data Verification ✅
- [ ] All 44 products have real images
- [ ] All prices are accurate (EUR to ZAR conversion)
- [ ] All product descriptions are complete
- [ ] Cost tracking (costEUR) is set for all products
- [ ] Product categories are correct

### 4. Files to Commit ✅
Check that these files are included:

**Modified Files:**
- [ ] `services/storefront/src/lib/constants.ts` (product data)
- [ ] `services/storefront/src/app/admin/products/page.tsx` (admin page)
- [ ] `services/storefront/src/app/globals.css` (Tiptap styles)

**New Files:**
- [ ] `services/storefront/src/components/admin/ProductEditModal.tsx`
- [ ] `services/storefront/src/components/admin/RichTextEditor.tsx`
- [ ] `services/storefront/src/components/admin/ArrayFieldEditor.tsx`
- [ ] `services/storefront/src/lib/validation/productValidation.ts`

**Documentation Files:**
- [ ] All `.md` documentation files
- [ ] `deploy.ps1` and `deploy.sh` scripts

## Deployment Process

### Option 1: Automated Deployment (Recommended)

#### Windows (PowerShell):
```powershell
.\deploy.ps1
```

#### Linux/Mac (Bash):
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

#### Step 1: Check Git Status
```bash
git status
```

#### Step 2: Stage Changes
```bash
git add .
```

#### Step 3: Commit Changes
```bash
git commit -m "feat: Add real Awake product data and admin dashboard improvements"
```

#### Step 4: Push to GitHub
```bash
git push origin main
```

#### Step 5: Monitor Vercel
- Go to: https://vercel.com/dashboard
- Watch deployment progress
- Wait for "Ready" status (2-3 minutes)

## Post-Deployment Verification

### 1. Vercel Dashboard ✅
- [ ] Deployment shows "Ready" status
- [ ] No build errors
- [ ] No runtime errors
- [ ] Deployment time is reasonable (< 5 minutes)

### 2. Live Site Testing ✅
Visit: https://storefront-teal-three.vercel.app

**Homepage:**
- [ ] Site loads without errors
- [ ] Hero section displays correctly
- [ ] Navigation works

**Products Page:**
- [ ] All 44 products display
- [ ] Product images load from Awake CDN
- [ ] Prices are correct (in ZAR)
- [ ] Product cards look good
- [ ] Filtering/sorting works

**Product Detail Pages:**
- [ ] Individual product pages load
- [ ] Images display correctly
- [ ] Descriptions are complete
- [ ] Specs and features show
- [ ] Add to cart works

**Admin Dashboard:**
- [ ] Admin page loads at `/admin/products`
- [ ] Password authentication works (`awake2026admin`)
- [ ] All 44 products show in table
- [ ] Edit button opens modal
- [ ] Preview mode works in rich text editor
- [ ] Array editors work (specs, features)
- [ ] Save changes works
- [ ] Toast notifications appear

### 3. Performance Testing ✅
- [ ] Page load time < 3 seconds
- [ ] Images load quickly
- [ ] No layout shift
- [ ] Mobile responsive
- [ ] No JavaScript errors in console

### 4. Cross-Browser Testing ✅
Test on:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## Rollback Plan

If something goes wrong:

### Option 1: Revert via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to "Deployments"
4. Find previous working deployment
5. Click "..." menu → "Promote to Production"

### Option 2: Revert via Git
```bash
# Find the commit to revert to
git log --oneline

# Revert to previous commit
git revert HEAD

# Push the revert
git push origin main
```

## Common Issues & Solutions

### Issue: Build fails on Vercel
**Solution:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally to test

### Issue: Images don't load
**Solution:**
- Check that image URLs are correct
- Verify Awake CDN is accessible
- Check browser console for CORS errors

### Issue: Admin dashboard doesn't work
**Solution:**
- Check that all component files are committed
- Verify imports are correct
- Check for TypeScript errors

### Issue: Products don't display
**Solution:**
- Verify `constants.ts` is committed
- Check that product data is valid
- Look for console errors

## Success Criteria

✅ All checks passed
✅ Deployment successful
✅ Live site works perfectly
✅ Admin dashboard functional
✅ All 44 products visible
✅ Preview mode works
✅ No errors in console

## Post-Deployment Tasks

- [ ] Announce deployment to team
- [ ] Update documentation if needed
- [ ] Monitor error logs for 24 hours
- [ ] Collect user feedback
- [ ] Plan next iteration

## Emergency Contacts

- **Vercel Support**: https://vercel.com/support
- **GitHub Issues**: Create issue in repository
- **Documentation**: Check all `.md` files in project root

---

## Quick Deploy Commands

**Windows:**
```powershell
.\deploy.ps1
```

**Linux/Mac:**
```bash
./deploy.sh
```

**Manual:**
```bash
git add .
git commit -m "feat: Add real Awake product data"
git push origin main
```

---

**Ready to Deploy?** Follow the checklist above! 🚀

