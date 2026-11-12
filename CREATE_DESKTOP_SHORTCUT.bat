@echo off
title Create Desktop Shortcut - FGRF Water Audit System
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'FGRF Water Audit System.lnk')); $s.TargetPath = '%~dp0START_APP.bat'; $s.WorkingDirectory = '%~dp0'; $s.Save()"
echo.
echo ====================================================================
echo Desktop shortcut "FGRF Water Audit System" has been created on your Desktop!
echo You can now launch the application directly from your Desktop anytime.
echo ====================================================================
echo.
pause
