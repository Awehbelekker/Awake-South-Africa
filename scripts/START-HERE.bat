@echo off
echo.
echo ========================================
echo  Awake Store - Product Export Tool
echo ========================================
echo.
echo Opening export tool in your browser...
echo.

start "" "%~dp0export-products-from-browser.html"

echo.
echo Instructions:
echo 1. Wait for the page to load
echo 2. It will check for products automatically
echo 3. Click "Export Products" button
echo 4. Save the file
echo 5. Come back here for next steps
echo.
echo ========================================
echo After exporting, choose your migration path:
echo ========================================
echo.
echo [A] Supabase (Easiest - 15 min)
echo     - Free tier available
echo     - Easy setup
echo     - Recommended for most users
echo.
echo [B] Medusa (Full E-commerce - 30 min)
echo     - Complete commerce features
echo     - More setup required
echo     - Best for scaling
echo.
echo [C] Both (Full Stack - 45 min)
echo     - Best of both worlds
echo     - Maximum flexibility
echo.
pause
