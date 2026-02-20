# Awake Store - Quick Start Migration
# Run this to begin the migration process

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  🏄 Awake Store - Product Migration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📦 Current Status:" -ForegroundColor Yellow
Write-Host "   - 44 products in localStorage" -ForegroundColor Green
Write-Host "   - Ready to migrate to database`n"

Write-Host "🎯 Choose your migration path:`n" -ForegroundColor Yellow

Write-Host "[1] Supabase (Recommended)" -ForegroundColor Green
Write-Host "    ✓ Easiest setup (15 min)"
Write-Host "    ✓ Free tier available"
Write-Host "    ✓ Perfect for most users`n"

Write-Host "[2] Medusa (Full E-commerce)" -ForegroundColor Cyan
Write-Host "    ✓ Complete commerce features (30 min)"
Write-Host "    ✓ Advanced inventory management"
Write-Host "    ✓ Best for scaling`n"

Write-Host "[3] Both (Full Stack)" -ForegroundColor Magenta
Write-Host "    ✓ Maximum flexibility (45 min)"
Write-Host "    ✓ Best of both worlds"
Write-Host "    ✓ For advanced users`n"

Write-Host "[0] Export products first" -ForegroundColor White
Write-Host "    ✓ Backup your data (required)`n"

$choice = Read-Host "Enter your choice (0-3)"

switch ($choice) {
    "0" {
        Write-Host "`n🚀 Opening export tool..." -ForegroundColor Green
        Start-Process "scripts\export-products-from-browser.html"
        Write-Host "`n📋 Instructions:" -ForegroundColor Yellow
        Write-Host "1. Wait for 'Ready! Found 44 products' message"
        Write-Host "2. Click '📦 Export Products'"
        Write-Host "3. Save the file"
        Write-Host "4. Run this script again to continue migration`n"
    }
    "1" {
        Write-Host "`n🔵 Starting Supabase migration..." -ForegroundColor Cyan
        Write-Host "`n📖 Opening guide..." -ForegroundColor Yellow
        Start-Process "MIGRATION_EXECUTION_GUIDE.md"
        Write-Host "`nFollow the 'Path A: Supabase' section in the guide`n"
        Write-Host "Quick steps:" -ForegroundColor Yellow
        Write-Host "1. Create Supabase account at https://supabase.com"
        Write-Host "2. Run: npx tsx scripts/setup-supabase.ts"
        Write-Host "3. Run: npx tsx scripts/migrate-products.ts`n"
    }
    "2" {
        Write-Host "`n🟠 Starting Medusa migration..." -ForegroundColor Yellow
        Write-Host "`n📖 Opening guide..." -ForegroundColor Yellow
        Start-Process "MIGRATION_EXECUTION_GUIDE.md"
        Write-Host "`nFollow the 'Path B: Medusa' section in the guide`n"
        Write-Host "Quick steps:" -ForegroundColor Yellow
        Write-Host "1. Visit: https://awake-south-africa-production.up.railway.app/app"
        Write-Host "2. Create admin account"
        Write-Host "3. Add credentials to .env.local"
        Write-Host "4. Run: npx tsx scripts/migrate-local-to-medusa.ts`n"
    }
    "3" {
        Write-Host "`n🟣 Starting full migration..." -ForegroundColor Magenta
        Write-Host "`n📖 Opening guide..." -ForegroundColor Yellow
        Start-Process "MIGRATION_EXECUTION_GUIDE.md"
        Write-Host "`nFollow 'Path C: Both' section in the guide`n"
        Write-Host "This will set up both Supabase AND Medusa`n"
    }
    default {
        Write-Host "`n❌ Invalid choice. Please run the script again.`n" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Need help? Check:" -ForegroundColor Yellow
Write-Host "  - MIGRATION_EXECUTION_GUIDE.md (full guide)"
Write-Host "  - PRODUCT_STORAGE_MIGRATION.md (overview)"
Write-Host "`n🏄 Good luck with your migration!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
