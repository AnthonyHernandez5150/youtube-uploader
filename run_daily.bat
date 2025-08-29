@echo off
REM Windows Batch Script for YouTube Shorts Automation
REM Schedule this to run twice daily (6 AM and 6 PM)

cd /d "C:\Users\mrtig\Desktop\Bible Shorts AutoUploader"

echo [%date% %time%] Starting Bible Shorts AutoUploader
node index.mjs --single

echo [%date% %time%] Bible Shorts AutoUploader completed
