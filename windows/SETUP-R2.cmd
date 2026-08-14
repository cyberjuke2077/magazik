@echo off
chcp 65001 >nul
title Electromagaz - настройка Cloudflare R2

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0configure-r2.ps1"
set "R2_EXIT=%ERRORLEVEL%"

echo.
if not "%R2_EXIT%"=="0" echo Настройка R2 не завершена. Код ошибки: %R2_EXIT%
pause
exit /b %R2_EXIT%
