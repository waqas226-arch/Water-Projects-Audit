@echo off
setlocal enabledelayedexpansion
title FGRF Water Projects - Google Cloud Deployment Assistant
color 0A

echo =======================================================================
echo   FAIZAN GLOBAL RELIEF FOUNDATION (FGRF)
echo   WATER PROJECTS AUDIT & MONITORING SYSTEM
echo   Google Cloud Publishing & Deployment Tool
echo   Author: Syed Waqas, Manager MIS (Data Management & ERP Department)
echo =======================================================================
echo.
echo Select your preferred Google Cloud deployment method:
echo.
echo [1] Firebase Hosting (Google Cloud Edge CDN - Recommended: Fastest, Free SSL, 100%% Free Tier)
echo [2] Google Cloud Run (Containerized Service - Server + Gemini AI Advisor)
echo [3] Google App Engine (PaaS Node.js Runtime)
echo [4] Build Production Bundle only (for Google Cloud Storage / Cloud Console drag-and-drop)
echo [5] Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto DEPLOY_FIREBASE
if "%choice%"=="2" goto DEPLOY_CLOUDRUN
if "%choice%"=="3" goto DEPLOY_APPENGINE
if "%choice%"=="4" goto BUILD_ONLY
if "%choice%"=="5" goto EXIT
goto INVALID

:DEPLOY_FIREBASE
echo.
echo -----------------------------------------------------------------------
echo [Step 1/3] Building latest production bundle...
echo -----------------------------------------------------------------------
call node node_modules/vite/bin/vite.js build
call node bundle-standalone.cjs

echo.
echo -----------------------------------------------------------------------
echo [Step 2/3] Logging in to Google Firebase...
echo (A browser window will open for your Google account login)
echo -----------------------------------------------------------------------
call npx -y firebase-tools login

echo.
echo -----------------------------------------------------------------------
echo [Step 3/3] Deploying to Firebase Hosting on Google Cloud...
echo -----------------------------------------------------------------------
call npx -y firebase-tools deploy --only hosting
echo.
echo =======================================================================
echo  DEPLOYMENT COMPLETE!
echo  Your software is now live on Google Cloud.
echo =======================================================================
pause
goto EXIT

:DEPLOY_CLOUDRUN
echo.
echo -----------------------------------------------------------------------
echo [Step 1/2] Checking Google Cloud SDK (gcloud CLI)...
echo -----------------------------------------------------------------------
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Google Cloud SDK (gcloud) is not installed on this PC.
    echo Please install it from: https://cloud.google.com/sdk/docs/install
    echo Or use Option [1] Firebase Hosting which works immediately via npx!
    echo.
    pause
    goto EXIT
)
echo.
set /p project_id="Enter your Google Cloud Project ID: "
echo Deploying to Cloud Run in region asia-south1 (Mumbai - Low latency for Pakistan)...
call gcloud run deploy fgrf-water-audit --source . --project %project_id% --platform managed --region asia-south1 --allow-unauthenticated
pause
goto EXIT

:DEPLOY_APPENGINE
echo.
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Google Cloud SDK (gcloud) is not installed on this PC.
    echo Please install it from: https://cloud.google.com/sdk/docs/install
    echo.
    pause
    goto EXIT
)
echo Deploying to Google App Engine...
call gcloud app deploy app.yaml
pause
goto EXIT

:BUILD_ONLY
echo.
echo Building production standalone bundle...
call node node_modules/vite/bin/vite.js build
call node bundle-standalone.cjs
echo.
echo Build complete! Ready files located in:
echo   1. dist/index.html
echo   2. index.html (Root)
echo.
pause
goto EXIT

:INVALID
echo Invalid choice.
pause
goto EXIT

:EXIT
exit /b
