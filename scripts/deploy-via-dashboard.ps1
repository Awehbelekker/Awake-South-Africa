# Deploy Supabase Schema via Dashboard
# This script guides you through deploying the database schema using Supabase Dashboard

Write-Host "`n🚀 SUPABASE SCHEMA DEPLOYMENT GUIDE" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

# Load environment variables
$envFile = Join-Path $PSScriptRoot ".." ".env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match 'NEXT_PUBLIC_SUPABASE_URL=(.+)') {
        $supabaseUrl = $matches[1].Trim()
        $projectId = if ($supabaseUrl -match '://(.+?)\.supabase') { $matches[1] } else { "" }
        
        Write-Host "`n📊 Project ID: $projectId" -ForegroundColor Green
        Write-Host "🔗 Database URL: $supabaseUrl`n" -ForegroundColor Green
    }
}

Write-Host "`nSTEP 1: Open Supabase SQL Editor" -ForegroundColor Yellow
Write-Host "-"*60
Write-Host "Open this URL in your browser:"
Write-Host "https://supabase.com/dashboard/project/$projectId/sql/new`n" -ForegroundColor Cyan

Write-Host "STEP 2: Deploy Base Schema" -ForegroundColor Yellow
Write-Host "-"*60
Write-Host "1. Copy the contents of: supabase/schema.sql"
Write-Host "2. Paste into the SQL Editor"
Write-Host "3. Click 'Run' button"
Write-Host "4. Wait for success message`n"

Write-Host "STEP 3: Deploy Migrations (14 files)" -ForegroundColor Yellow
Write-Host "-"*60

$migrationsDir = Join-Path $PSScriptRoot ".." "supabase" "migrations"
$migrations = Get-ChildItem $migrationsDir -Filter "*.sql" | Sort-Object Name

Write-Host "Deploy these migrations IN ORDER:`n"
$counter = 1
foreach ($migration in $migrations) {
    Write-Host "  $counter. $($migration.Name)" -ForegroundColor White
    $counter++
}

Write-Host "`n📋 For each migration file:" -ForegroundColor Cyan
Write-Host "   - Open the file from: supabase/migrations/"
Write-Host "   - Copy its contents"
Write-Host "   - Paste into SQL Editor"
Write-Host "   - Click 'Run'`n"

Write-Host "="*60 -ForegroundColor Cyan
Write-Host "⚡ QUICK DEPLOY OPTION" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Cyan
Write-Host "`nYou can also paste ALL migration files at once:"
Write-Host "1. Open SQL Editor"
Write-Host "2. Paste schema.sql first, click Run"
Write-Host "3. Create a new query"
Write-Host "4. Copy all migration files contents (in order)"
Write-Host "5. Paste and Run`n"

Write-Host "="*60 -ForegroundColor Cyan
Write-Host "`n✅ AFTER DEPLOYMENT:" -ForegroundColor Green
Write-Host "   Run: node scripts/verify-schema.js"
Write-Host "   To verify all tables were created successfully`n"

Write-Host "Press any key to open Supabase Dashboard..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open Supabase Dashboard
$dashboardUrl = "https://supabase.com/dashboard/project/$projectId/sql/new"
Start-Process $dashboardUrl

Write-Host "`n🌐 Opening Supabase Dashboard in browser..." -ForegroundColor Green
Write-Host "📝 Remember to deploy schema.sql FIRST, then migrations IN ORDER`n" -ForegroundColor Yellow
