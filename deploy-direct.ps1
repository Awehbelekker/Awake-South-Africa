# Awake Boards SA - Direct Vercel Deployment Script
# This script deploys directly to Vercel without GitHub

Write-Host "🚀 Awake Boards SA - Direct Vercel Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Vercel CLI is installed
Write-Host "📋 Step 1: Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
}

# Step 2: Navigate to storefront directory
Write-Host ""
Write-Host "📂 Step 2: Navigating to storefront..." -ForegroundColor Yellow
Set-Location -Path "services\storefront"
Write-Host "✅ In storefront directory" -ForegroundColor Green

# Step 3: Install dependencies
Write-Host ""
Write-Host "📦 Step 3: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 4: Build the project
Write-Host ""
Write-Host "🔨 Step 4: Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please fix errors and try again." -ForegroundColor Red
    exit 1
}

# Step 5: Deploy to Vercel
Write-Host ""
Write-Host "🚀 Step 5: Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "   This will deploy directly to production" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Deploy to production? (y/n)"
if ($confirm -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    Set-Location -Path "..\..\"
    exit 0
}

# Deploy to production
vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully deployed to Vercel!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Set-Location -Path "..\..\"
    exit 1
}

# Step 6: Return to root directory
Set-Location -Path "..\..\"

# Step 7: Success message
Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your changes are now live!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Visit your live site: https://storefront-teal-three.vercel.app" -ForegroundColor White
Write-Host "2. Test all 44 products display correctly" -ForegroundColor White
Write-Host "3. Test admin dashboard: /admin/products" -ForegroundColor White
Write-Host "4. Verify preview mode works" -ForegroundColor White
Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green

