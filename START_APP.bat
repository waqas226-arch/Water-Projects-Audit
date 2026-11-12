@echo off
title FGRF - Water Projects Audit & Monitoring System
cls
echo ====================================================================
echo   FAIZAN GLOBAL RELIEF FOUNDATION (FGRF)
echo   Water Projects Audit & Monitoring System
echo   MIS & ERP Department - Syed Waqas, Manager MIS
echo ====================================================================
echo.
echo [1/2] Checking environment...
cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH.
    echo Please install Node.js from https://nodejs.org/ to run the system.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Installing required dependencies (first-time setup)...
    call npm install --legacy-peer-deps
)

echo [2/2] Starting FGRF Water Audit & Monitoring System...
echo.
echo The application will open automatically in your web browser.
echo Keep this window open while using the application.
echo Press Ctrl+C when you want to stop the system.
echo.

node node_modules\tsx\dist\cli.mjs server.ts

pause
