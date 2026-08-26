@echo off
chcp 65001 >nul
title Electromagaz parser setup

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-parser.ps1"
set "INSTALL_EXIT=%ERRORLEVEL%"

echo.
if not "%INSTALL_EXIT%"=="0" (
  echo Setup failed. Exit code: %INSTALL_EXIT%
  echo Read the message above and press any key.
) else (
  echo Setup completed. Run RUN-PARSER.cmd next.
)
pause >nul
exit /b %INSTALL_EXIT%
