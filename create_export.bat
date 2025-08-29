@echo off
echo ========================================
echo  📦 Bible Shorts - Export Setup
echo ========================================
echo.

cd /d "c:\Users\mrtig\Desktop\Bible Shorts AutoUploader"

echo Creating portable package...
echo.

if not exist "export" mkdir export

echo Copying essential files...
xcopy /E /I /Y *.* export\ /EXCLUDE:export_exclude.txt

echo.
echo ✅ Export complete!
echo.
echo Your portable Bible Shorts AutoUploader is in the 'export' folder.
echo Copy this folder to any Windows PC and run START_HERE.bat
echo.
echo 📁 Location: %cd%\export\
echo.

pause
