# Vercel Deployment Setup

## Environment Variables Needed in Vercel

To deploy successfully, add these environment variables in your Vercel dashboard:

### PayFast Payment Gateway
```
NEXT_PUBLIC_PAYFAST_MERCHANT_ID=22177662
NEXT_PUBLIC_PAYFAST_MERCHANT_KEY=i5bwl7lzgyzvh
NEXT_PUBLIC_PAYFAST_PASSPHRASE=AwehBeLekker247
NEXT_PUBLIC_PAYFAST_MODE=live
```

### Site Configuration
```
NEXT_PUBLIC_SITE_URL=https://storefront-teal-three.vercel.app
```

## How to Add Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `storefront-teal-three`
3. Go to **Settings** → **Environment Variables**
4. Add each variable above with the corresponding value
5. Select **Production**, **Preview**, and **Development** for each variable
6. Click **Save**
7. Go to **Deployments** → Find latest deployment → Click **...** → **Redeploy**

## Current Deployment Status

- **Live URL**: https://storefront-teal-three.vercel.app
- **GitHub**: https://github.com/Awehbelekker/Awake-South-Africa
- **Last Commit**: 8cf2450 - Add Medusa backend with cost tracking

## Common Issues & Solutions

### Products Not Showing
**Cause**: Local changes not committed/pushed to GitHub  
**Solution**: 
```bash
git add .
git commit -m "Update products"
git push
```
Vercel will auto-deploy when it detects GitHub changes.

### Payment Errors
**Cause**: Missing PayFast environment variables  
**Solution**: Add all PayFast variables in Vercel dashboard (see above)

### Build Failures
**Cause**: Missing dependencies or TypeScript errors  
**Solution**: Check build logs in Vercel dashboard, fix locally, then push

## Admin Panel Access

Once deployed, access the admin panel:
- **URL**: https://storefront-teal-three.vercel.app/admin
- **Password**: awake2026admin

Features:
- Edit products (prices, costs, stock)
- Update store settings (exchange rate, margin, contact info)
- View cost/margin reports
- Manage inventory

## Future Improvements

### Move PayFast to Backend
Currently PayFast is integrated in the frontend (not ideal for security).

**Better approach**: 
1. Set up Medusa backend (PostgreSQL + Redis)
2. Create custom PayFast payment provider in Medusa
3. Move payment logic to backend API
4. Update checkout to call Medusa payment API

### Connect to Medusa Database
Currently products are stored in browser localStorage (admin panel).

**Better approach**:
1. Deploy Medusa backend to Railway/Heroku
2. Update `NEXT_PUBLIC_MEDUSA_BACKEND_URL` in Vercel
3. Replace localStorage with API calls to Medusa
4. Products persist in PostgreSQL database

## Deployment Checklist

Before each deployment:
- [ ] Test locally: `npm run dev`
- [ ] Check for TypeScript errors: `npm run build`
- [ ] Commit all changes: `git add . && git commit -m "..."`
- [ ] Push to GitHub: `git push`
- [ ] Verify Vercel auto-deploy completes (2-3 minutes)
- [ ] Test live site functionality
- [ ] Check admin panel works

## Support

For issues:
1. Check Vercel build logs
2. Review this document
3. Test locally first
4. Verify environment variables are set
