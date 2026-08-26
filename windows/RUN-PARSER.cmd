@echo off
chcp 65001 >nul
title Electromagaz catalog parser

if not exist "%~dp0..\node_modules" (
  echo Running first-time setup...
  call "%~dp0INSTALL.cmd"
  if errorlevel 1 exit /b %ERRORLEVEL%
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0parser-menu.ps1"
set "PARSER_EXIT=%ERRORLEVEL%"

if not "%PARSER_EXIT%"=="0" (
  echo.
  echo Parser menu failed. Exit code: %PARSER_EXIT%
  pause
)
exit /b %PARSER_EXIT%
