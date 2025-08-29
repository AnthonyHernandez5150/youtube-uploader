@echo off
echo ========================================
echo  📦 Building Bible Shorts AutoUploader
echo ========================================
echo.

cd /d "c:\Users\mrtig\Desktop\Bible Shorts AutoUploader"

echo 1. Installing build dependencies...
npm install electron-builder --save-dev

echo.
echo 2. Building Windows executable...
npm run build-win

echo.
echo 3. Build complete! Check the 'dist' folder for your installer.
echo.
echo Files created:
dir dist

pause
