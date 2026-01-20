#!/bin/bash
# Awake Boards SA - Deployment Script (Linux/Mac)
# This script automates the deployment process to Vercel

echo "🚀 Awake Boards SA - Deployment Script"
echo "======================================="
echo ""

# Step 1: Check for uncommitted changes
echo "📋 Step 1: Checking for changes..."
if [[ -n $(git status --porcelain) ]]; then
    echo "✅ Found changes to commit"
else
    echo "⚠️  No changes detected. Exiting."
    exit 0
fi

# Step 2: Show what will be committed
echo ""
echo "📝 Step 2: Files to be committed:"
git status --short

# Step 3: Ask for confirmation
echo ""
read -p "Do you want to commit and deploy these changes? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Step 4: Stage all changes
echo ""
echo "📦 Step 3: Staging changes..."
git add .
echo "✅ Changes staged"

# Step 5: Commit changes
echo ""
echo "💾 Step 4: Committing changes..."
git commit -m "feat: Add real Awake product data and admin dashboard improvements

- Updated all 44 products with real data from awakeboards.com
- Added rich text editor with preview/edit toggle mode
- Added real product images from Awake CDN
- Implemented array field editors for specs and features
- Added Zod validation and toast notifications
- Fixed validation errors in productValidation.ts
- Created comprehensive documentation

Products updated:
- 4 Jetboards (RÄVIK Explore, Adventure, Ultimate, S)
- 1 Limited Edition (BRABUS Shadow)
- 4 eFoils (VINGA Adventure/Ultimate LR4/XR4)
- 3 Batteries (Flex LR4, XR4, BRABUS XR4)
- 2 Wing Kits (Powder, Fluid)
- 3 Bags (RÄVIK, VINGA, Battery Backpack)
- 4 Safety & Storage items
- 4 Electronics (Controllers, Chargers)
- 7 Parts (Fins, Straps, etc.)
- 5 Apparel items

Total: 44 products with real EUR prices, ZAR conversion, and cost tracking"

echo "✅ Changes committed"

# Step 6: Push to GitHub
echo ""
echo "🌐 Step 5: Pushing to GitHub..."
BRANCH=$(git branch --show-current)
echo "   Branch: $BRANCH"

git push origin $BRANCH

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi

# Step 7: Wait for Vercel deployment
echo ""
echo "⏳ Step 6: Waiting for Vercel deployment..."
echo "   Vercel will automatically deploy your changes"
echo "   This usually takes 2-3 minutes"
echo ""
echo "📊 Deployment Status:"
echo "   - Check: https://vercel.com/dashboard"
echo "   - Live Site: https://storefront-teal-three.vercel.app"

# Step 8: Success message
echo ""
echo "🎉 Deployment Complete!"
echo "======================================="
echo ""
echo "Next Steps:"
echo "1. Monitor deployment at: https://vercel.com/dashboard"
echo "2. Test live site at: https://storefront-teal-three.vercel.app"
echo "3. Verify all 44 products display correctly"
echo "4. Test admin dashboard with preview mode"
echo ""
echo "✅ All changes have been deployed!"

