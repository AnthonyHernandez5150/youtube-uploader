@echo off
title Bible Shorts AutoUploader - Deployment Menu
color 0A

:menu
cls
echo ========================================
echo  📖 Bible Shorts AutoUploader v2.0
echo ========================================
echo.
echo Choose deployment option:
echo.
echo [1] 🎯 Run Once (Generate 1 video)
echo [2] 🎬 Run GUI Application  
echo [3] 📦 Build Windows Installer
echo [4] 🔄 Run Continuously
echo [5] 📊 Check Status
echo [6] 🚪 Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto run_once
if "%choice%"=="2" goto run_gui
if "%choice%"=="3" goto build
if "%choice%"=="4" goto run_loop
if "%choice%"=="5" goto status
if "%choice%"=="6" goto exit
echo Invalid choice. Please try again.
pause
goto menu

:run_once
cls
echo Running single video generation...
cd /d "c:\Users\mrtig\Desktop\Bible Shorts AutoUploader"
node index.mjs
pause
goto menu

:run_gui
cls
echo Starting GUI application...
cd /d "c:\Users\mrtig\Desktop\Bible Shorts AutoUploader"
start "" npx electron gui/main.js
goto menu

:build
cls
echo Building Windows executable...
cd /d "c:\Users\mrtig\Desktop\Bible Shorts AutoUploader"
call build_executable.bat
goto menu

:run_loop
cls
echo Starting continuous generation...
echo Press Ctrl+C to stop
cd /d "c:\Users\mrtig\Desktop\Bible Shorts AutoUploader"
:loop
node index.mjs
timeout /t 300 /nobreak
goto loop

:status
cls
echo Checking system status...
cd /d "c:\Users\mrtig\Desktop\Bible Shorts AutoUploader"
node -e "import('./tools/scriptStatus.mjs').then(m => m.showScriptStatus())"
pause
goto menu

:exit
echo Goodbye!
exit
