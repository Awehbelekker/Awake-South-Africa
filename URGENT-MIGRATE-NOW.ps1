# URGENT: Migrate Products from localStorage to Supabase
# This script will backup and migrate your 44 products to prevent data loss

Write-Host "`n🚨 URGENT: PRODUCT MIGRATION STARTING`n" -ForegroundColor Red

# Step 1: Open export tool
Write-Host "STEP 1: Opening export tool..." -ForegroundColor Cyan
Write-Host "ACTION REQUIRED: In the browser window that opens:" -ForegroundColor Yellow
Write-Host "  1. Wait for 'Ready! Found 44 products'" -ForegroundColor Yellow
Write-Host "  2. Click 'Export Products' button" -ForegroundColor Yellow
Write-Host "  3. Save the JSON file (it will auto-download)" -ForegroundColor Yellow
Write-Host "`nPress ENTER when file is downloaded..." -ForegroundColor Green

Start-Process "scripts/export-products-from-browser.html"
$null = Read-Host

# Step 2: Find the backup file
Write-Host "`nSTEP 2: Looking for backup file..." -ForegroundColor Cyan
$backupFile = Get-ChildItem -Filter "awake-products-backup-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $backupFile) {
    Write-Host "❌ ERROR: No backup file found!" -ForegroundColor Red
    Write-Host "Please make sure you clicked 'Export Products' and the file downloaded." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found backup: $($backupFile.Name)" -ForegroundColor Green
Write-Host "   Size: $([math]::Round($backupFile.Length/1KB, 2)) KB" -ForegroundColor Gray

# Step 3: Verify Supabase connection
Write-Host "`nSTEP 3: Verifying Supabase connection..." -ForegroundColor Cyan
node scripts/verify-import.js

# Step 4: Run migration
Write-Host "`nSTEP 4: Migrating products to Supabase..." -ForegroundColor Cyan
Write-Host "⏳ This will take about 1-2 minutes..." -ForegroundColor Yellow

npx tsx scripts/migrate-products.ts $backupFile.Name

# Step 5: Verify migration
Write-Host "`nSTEP 5: Verifying migration..." -ForegroundColor Cyan
node scripts/verify-import.js

Write-Host "`n✅ MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "Your products are now safely stored in Supabase database." -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Keep the backup file: $($backupFile.Name)" -ForegroundColor White
Write-Host "  2. Test your products page: http://localhost:3000/products" -ForegroundColor White
Write-Host "  3. Backup file location: $($backupFile.FullName)" -ForegroundColor Gray
