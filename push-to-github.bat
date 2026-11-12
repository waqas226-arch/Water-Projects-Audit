@echo off
setlocal enabledelayedexpansion
title FGRF Water Projects - Push to GitHub Assistant
color 0B

echo =======================================================================
echo   FAIZAN GLOBAL RELIEF FOUNDATION (FGRF)
echo   WATER PROJECTS AUDIT ^& MONITORING SYSTEM
echo   GitHub Publishing ^& Online Deployment Assistant
echo   Author: Syed Waqas, Manager MIS (Data Management ^& ERP Department)
echo =======================================================================
echo.

:: Detect git executable
set "GIT_EXE=git"
where git >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\MinGit\cmd\git.exe" (
        set "GIT_EXE=%LOCALAPPDATA%\MinGit\cmd\git.exe"
    ) else if exist "%ProgramFiles%\Git\cmd\git.exe" (
        set "GIT_EXE=%ProgramFiles%\Git\cmd\git.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
        set "GIT_EXE=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
    ) else (
        echo [INFO] Portable Git is being initialized, please wait...
        node scratch\setup-git.cjs
        if exist "%LOCALAPPDATA%\MinGit\cmd\git.exe" (
            set "GIT_EXE=%LOCALAPPDATA%\MinGit\cmd\git.exe"
        ) else (
            echo [ERROR] Git was not found. Please install Git from https://git-scm.com/download/win
            pause
            exit /b 1
        )
    )
)

echo [OK] Using Git engine: "!GIT_EXE!"
echo.

:: 1. Ensure build is fresh
echo [Step 1/5] Verifying production build...
call node node_modules\vite\bin\vite.js build
call node bundle-standalone.cjs
echo.

:: 2. Initialize Git repo if needed
echo [Step 2/5] Initializing local Git repository...
if not exist ".git" (
    "!GIT_EXE!" init
)

:: Configure user identity if not already configured
"!GIT_EXE!" config user.name >nul 2>nul
if %errorlevel% neq 0 (
    "!GIT_EXE!" config user.name "Syed Waqas"
    "!GIT_EXE!" config user.email "waqas.mis@fgrf.org"
)

"!GIT_EXE!" branch -M main
echo.

:: 3. Stage and commit files
echo [Step 3/5] Staging and committing files...
"!GIT_EXE!" add .
"!GIT_EXE!" commit -m "FGRF Water Projects Audit & Monitoring System v3.0 - Ready for Online Operation"
echo.

:: 4. Ask for GitHub Remote URL
echo [Step 4/5] Connecting to GitHub Repository...
echo.
echo If you haven't created a GitHub repository yet:
echo 1. Open your browser and go to: https://github.com/new
echo 2. Repository Name: fgrf-water-projects-audit (or any name you prefer)
echo 3. Choose Public (or Private)
echo 4. Do NOT check 'Add a README file'
echo 5. Click 'Create repository'
echo 6. Copy the repository HTTPS link (e.g. https://github.com/YOUR_USERNAME/fgrf-water-projects-audit.git)
echo.

set /p GITHUB_URL="Enter your GitHub Repository URL: "

if "!GITHUB_URL!"=="" (
    echo [ERROR] No GitHub URL provided. Operation cancelled.
    pause
    exit /b 1
)

:: Check if origin exists
"!GIT_EXE!" remote get-url origin >nul 2>nul
if %errorlevel% equ 0 (
    "!GIT_EXE!" remote set-url origin "!GITHUB_URL!"
) else (
    "!GIT_EXE!" remote add origin "!GITHUB_URL!"
)

echo.
:: 5. Push to GitHub
echo [Step 5/5] Pushing software to GitHub main branch...
echo (A GitHub login window may appear in your browser if not logged in)
echo.
"!GIT_EXE!" push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo =======================================================================
    echo   SUCCESSFULLY PUSHED TO GITHUB!
    echo =======================================================================
    echo.
    echo To make your software accessible ONLINE on GitHub Pages:
    echo 1. Open your repo on GitHub: !GITHUB_URL!
    echo 2. Click 'Settings' (اوپر سیٹنگز پر کلک کریں)
    echo 3. Click 'Pages' on the left menu (بائیں جانب پیجز پر کلک کریں)
    echo 4. Under 'Build and deployment' -> 'Source', select 'GitHub Actions'
    echo 5. Within 1 minute, your system will be LIVE online at:
    echo    https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
    echo.
    echo All field inspectors, supervisors, and HQ can now use it online!
    echo =======================================================================
) else (
    echo.
    echo [ERROR] Push failed. Please check your GitHub repository URL and credentials.
)

pause
