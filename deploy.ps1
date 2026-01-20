# Awake Boards SA - Deployment Script
# This script automates the deployment process to Vercel

Write-Host "🚀 Awake Boards SA - Deployment Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check for uncommitted changes
Write-Host "📋 Step 1: Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "✅ Found changes to commit" -ForegroundColor Green
} else {
    Write-Host "⚠️  No changes detected. Exiting." -ForegroundColor Red
    exit 0
}

# Step 2: Show what will be committed
Write-Host ""
Write-Host "📝 Step 2: Files to be committed:" -ForegroundColor Yellow
git status --short

# Step 3: Ask for confirmation
Write-Host ""
$confirm = Read-Host "Do you want to commit and deploy these changes? (y/n)"
if ($confirm -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

# Step 4: Stage all changes
Write-Host ""
Write-Host "📦 Step 3: Staging changes..." -ForegroundColor Yellow
git add .
Write-Host "✅ Changes staged" -ForegroundColor Green

# Step 5: Commit changes
Write-Host ""
Write-Host "💾 Step 4: Committing changes..." -ForegroundColor Yellow
$commitMessage = @"
feat: Add real Awake product data and admin dashboard improvements

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

Total: 44 products with real EUR prices, ZAR conversion, and cost tracking
"@

git commit -m $commitMessage
Write-Host "✅ Changes committed" -ForegroundColor Green

# Step 6: Push to GitHub
Write-Host ""
Write-Host "🌐 Step 5: Pushing to GitHub..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "   Branch: $branch" -ForegroundColor Cyan

git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    exit 1
}

# Step 7: Wait for Vercel deployment
Write-Host ""
Write-Host "⏳ Step 6: Waiting for Vercel deployment..." -ForegroundColor Yellow
Write-Host "   Vercel will automatically deploy your changes" -ForegroundColor Cyan
Write-Host "   This usually takes 2-3 minutes" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Deployment Status:" -ForegroundColor Yellow
Write-Host "   - Check: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "   - Live Site: https://storefront-teal-three.vercel.app" -ForegroundColor Cyan

# Step 8: Success message
Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Monitor deployment at: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Test live site at: https://storefront-teal-three.vercel.app" -ForegroundColor White
Write-Host "3. Verify all 44 products display correctly" -ForegroundColor White
Write-Host "4. Test admin dashboard with preview mode" -ForegroundColor White
Write-Host ""
Write-Host "✅ All changes have been deployed!" -ForegroundColor Green

