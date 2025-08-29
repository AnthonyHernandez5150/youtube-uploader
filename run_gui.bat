@echo off
echo ========================================
echo  📖 Starting Bible Shorts GUI
echo ========================================
echo.

cd /d "c:\Users\mrtig\Desktop\Bible Shorts AutoUploader"

echo Checking GUI dependencies...
if not exist "node_modules\electron" (
    echo Installing Electron...
    npm install electron --save-dev
)

echo.
echo Starting GUI Application...
npx electron gui/main.js

pause
