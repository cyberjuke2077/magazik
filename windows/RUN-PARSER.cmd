@echo off
chcp 65001 >nul
title Electromagaz - парсер каталога

if not exist "%~dp0..\node_modules" (
  echo Сначала выполняю первичную установку...
  call "%~dp0INSTALL.cmd"
  if errorlevel 1 exit /b %ERRORLEVEL%
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0parser-menu.ps1"
set "PARSER_EXIT=%ERRORLEVEL%"

if not "%PARSER_EXIT%"=="0" (
  echo.
  echo Парсер завершился с ошибкой. Код: %PARSER_EXIT%
  pause
)
exit /b %PARSER_EXIT%
