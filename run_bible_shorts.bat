@echo off
echo ========================================
echo  📖 Bible Shorts AutoUploader v2.0
echo ========================================
echo.

cd /d "c:\Users\mrtig\Desktop\Bible Shorts AutoUploader"

echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting Bible Shorts Generator...
echo Press Ctrl+C to stop
echo.

node index.mjs

pause
