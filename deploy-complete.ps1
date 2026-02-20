#!/usr/bin/env pwsh
# Deployment Script for Multi-Tenant Image Management System
# Run this step-by-step

Write-Host "`n🚀 DEPLOYMENT WIZARD - Multi-Tenant Image System`n" -ForegroundColor Cyan

# ============================================================================
# STEP 1: Run SQL Migration for Google Drive
# ============================================================================
Write-Host "📋 STEP 1: Database Migration (Google Drive Columns)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nAction Required:" -ForegroundColor White
Write-Host "1. Open: https://supabase.com/dashboard/project/iepeffuszswxuwyqrzix/sql/new" -ForegroundColor Green
Write-Host "2. Copy/paste contents of: supabase/add-google-drive-to-tenants.sql" -ForegroundColor Green
Write-Host "3. Click 'RUN' button" -ForegroundColor Green

$sql1Done = Read-Host "`nHave you run the SQL migration? (yes/no)"
if ($sql1Done -ne "yes") {
    Write-Host "❌ Please complete Step 1 before continuing" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Step 1 Complete!`n" -ForegroundColor Green

# ============================================================================
# STEP 2: Create Storage Buckets
# ============================================================================
Write-Host "📦 STEP 2: Create Supabase Storage Buckets" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nAction Required:" -ForegroundColor White
Write-Host "1. Open: https://supabase.com/dashboard/project/iepeffuszswxuwyqrzix/storage/buckets" -ForegroundColor Green
Write-Host "2. Click 'New Bucket'" -ForegroundColor Green
Write-Host "3. Name: product-images" -ForegroundColor Cyan
Write-Host "   - Public bucket: ✅ YES" -ForegroundColor Cyan
Write-Host "   - Click 'Create bucket'" -ForegroundColor Cyan
Write-Host "4. Click 'New Bucket' again" -ForegroundColor Green
Write-Host "5. Name: store-assets" -ForegroundColor Cyan
Write-Host "   - Public bucket: ✅ YES" -ForegroundColor Cyan
Write-Host "   - Click 'Create bucket'" -ForegroundColor Cyan

$bucketsDone = Read-Host "`nHave you created both buckets? (yes/no)"
if ($bucketsDone -ne "yes") {
    Write-Host "❌ Please complete Step 2 before continuing" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Step 2 Complete!`n" -ForegroundColor Green

# ============================================================================
# STEP 3: Run Storage RLS Policies
# ============================================================================
Write-Host "🔒 STEP 3: Set Up Storage Security Policies" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nAction Required:" -ForegroundColor White
Write-Host "1. Go back to SQL Editor: https://supabase.com/dashboard/project/iepeffuszswxuwyqrzix/sql/new" -ForegroundColor Green
Write-Host "2. Copy/paste contents of: supabase/setup-storage-buckets.sql" -ForegroundColor Green
Write-Host "3. Click 'RUN' button" -ForegroundColor Green

$sql2Done = Read-Host "`nHave you run the storage policies SQL? (yes/no)"
if ($sql2Done -ne "yes") {
    Write-Host "❌ Please complete Step 3 before continuing" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Step 3 Complete!`n" -ForegroundColor Green

# ============================================================================
# STEP 4: Get Google Client Secret
# ============================================================================
Write-Host "🔑 STEP 4: Get Google Drive Client Secret" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nAction Required:" -ForegroundColor White
Write-Host "1. Open: https://console.cloud.google.com/apis/credentials" -ForegroundColor Green
Write-Host "2. Find OAuth 2.0 Client ID: 39956410829-ihrhivfrsenidriv66896el6r9u1m8md" -ForegroundColor Green
Write-Host "3. Click on it to view details" -ForegroundColor Green
Write-Host "4. Copy the 'Client Secret' value" -ForegroundColor Green

$clientSecret = Read-Host "`nPaste your Google Client Secret here"
if ([string]::IsNullOrWhiteSpace($clientSecret) -or $clientSecret -eq "YOUR_CLIENT_SECRET_HERE") {
    Write-Host "❌ Please provide a valid Client Secret" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Step 4 Complete!`n" -ForegroundColor Green

# ============================================================================
# STEP 5: Update Environment Variables
# ============================================================================
Write-Host "⚙️  STEP 5: Update Environment Variables" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nUpdating .env.local with Google Client Secret..." -ForegroundColor White

# Read current .env.local
$envContent = Get-Content .env.local -Raw

# Replace placeholder with actual secret
$envContent = $envContent -replace 'GOOGLE_DRIVE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE.*', "GOOGLE_DRIVE_CLIENT_SECRET=$clientSecret"

# Write back
Set-Content .env.local -Value $envContent

Write-Host "✅ Local environment updated!`n" -ForegroundColor Green

# ============================================================================
# STEP 6: Test Locally (Optional but Recommended)
# ============================================================================
Write-Host "🧪 STEP 6: Test Locally (Recommended)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nBefore deploying to production, you should test locally:" -ForegroundColor White
Write-Host "1. Run: npm run dev" -ForegroundColor Cyan
Write-Host "2. Visit: http://localhost:3000/admin/import" -ForegroundColor Cyan
Write-Host "3. Click 'Connect Google Drive'" -ForegroundColor Cyan
Write-Host "4. Test browsing folders and transferring images" -ForegroundColor Cyan
Write-Host "5. Verify images appear in Supabase Storage" -ForegroundColor Cyan

$testLocal = Read-Host "`nDo you want to test locally first? (yes/no)"

if ($testLocal -eq "yes") {
    Write-Host "`n🔧 Starting development server..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C when done testing, then re-run this script`n" -ForegroundColor Yellow
    npm run dev
    exit 0
}

# ============================================================================
# STEP 7: Update Google OAuth Redirect URIs
# ============================================================================
Write-Host "`n🌐 STEP 7: Update Google OAuth Redirect URIs" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nWhat is your production domain?" -ForegroundColor White
Write-Host "Examples: awake-store.vercel.app, yourdomain.com" -ForegroundColor Gray
$productionDomain = Read-Host "Enter domain (without http/https)"

if ([string]::IsNullOrWhiteSpace($productionDomain)) {
    Write-Host "❌ Domain is required" -ForegroundColor Red
    exit 1
}

Write-Host "`nAction Required:" -ForegroundColor White
Write-Host "1. Open: https://console.cloud.google.com/apis/credentials" -ForegroundColor Green
Write-Host "2. Click your OAuth Client ID" -ForegroundColor Green
Write-Host "3. Add these Authorized Redirect URIs:" -ForegroundColor Green
Write-Host "   - http://localhost:3000/api/oauth/google/callback" -ForegroundColor Cyan
Write-Host "   - https://$productionDomain/api/oauth/google/callback" -ForegroundColor Cyan
Write-Host "4. Click 'SAVE'" -ForegroundColor Green

$redirectDone = Read-Host "`nHave you added the redirect URIs? (yes/no)"
if ($redirectDone -ne "yes") {
    Write-Host "❌ Please complete Step 7 before deploying" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Step 7 Complete!`n" -ForegroundColor Green

# ============================================================================
# STEP 8: Set Vercel Environment Variables
# ============================================================================
Write-Host "📤 STEP 8: Set Vercel Environment Variables" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nSetting Vercel environment variables..." -ForegroundColor White

# Set each environment variable in Vercel
$envVars = @(
    @{ name = "GOOGLE_DRIVE_CLIENT_SECRET"; value = $clientSecret },
    @{ name = "NEXT_PUBLIC_APP_URL"; value = "https://$productionDomain" }
)

foreach ($var in $envVars) {
    Write-Host "Setting $($var.name)..." -ForegroundColor Cyan
    vercel env add $var.name production
    Write-Host $var.value | vercel env add $var.name production
}

Write-Host "✅ Environment variables set!`n" -ForegroundColor Green

# ============================================================================
# STEP 9: Deploy to Vercel
# ============================================================================
Write-Host "🚀 STEP 9: Deploy to Vercel Production" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`nDeploying to production..." -ForegroundColor White
vercel --prod

Write-Host "`n✅ DEPLOYMENT COMPLETE! 🎉`n" -ForegroundColor Green

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "📊 DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n✅ Database migrations: Complete" -ForegroundColor Green
Write-Host "✅ Storage buckets: Created" -ForegroundColor Green
Write-Host "✅ RLS policies: Applied" -ForegroundColor Green
Write-Host "✅ Google OAuth: Configured" -ForegroundColor Green
Write-Host "✅ Environment variables: Set" -ForegroundColor Green
Write-Host "✅ Production deployment: Live" -ForegroundColor Green

Write-Host "`n🌐 Your store is live at: https://$productionDomain" -ForegroundColor Cyan
Write-Host "🔧 Admin portal: https://$productionDomain/admin" -ForegroundColor Cyan

Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Visit your production admin portal" -ForegroundColor White
Write-Host "2. Test Google Drive connection" -ForegroundColor White
Write-Host "3. Browse folders and transfer images" -ForegroundColor White
Write-Host "4. Onboard your first tenant (Kelp recommended)" -ForegroundColor White

Write-Host "`n📚 DOCUMENTATION:" -ForegroundColor Yellow
Write-Host "- Technical Guide: COMPLETE_IMAGE_MANAGEMENT_SYSTEM.md" -ForegroundColor White
Write-Host "- User Guide: TENANT_ADMIN_USER_GUIDE.md" -ForegroundColor White
Write-Host "- Deployment Checklist: DEPLOYMENT_CHECKLIST_FINAL.md" -ForegroundColor White

Write-Host "`n🎉 You're ready to onboard tenants!`n" -ForegroundColor Green
