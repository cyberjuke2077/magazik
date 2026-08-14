@echo off
chcp 65001 >nul
title Electromagaz - установка парсера

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-parser.ps1"
set "INSTALL_EXIT=%ERRORLEVEL%"

echo.
if not "%INSTALL_EXIT%"=="0" (
  echo Установка не завершена. Код ошибки: %INSTALL_EXIT%
  echo Прочитайте сообщение выше, затем нажмите любую клавишу.
) else (
  echo Установка завершена. Теперь запустите RUN-PARSER.cmd.
)
pause >nul
exit /b %INSTALL_EXIT%
