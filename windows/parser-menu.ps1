$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Select-InputFolder {
  Add-Type -AssemblyName System.Windows.Forms
  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = 'Выберите папку с файлами заказчика'
  $dialog.ShowNewFolderButton = $false
  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    return $null
  }
  return $dialog.SelectedPath
}

function Ensure-LocalDatabase {
  & docker info *> $null
  if ($LASTEXITCODE -ne 0) {
    throw 'Docker не запущен. Откройте Docker Desktop и дождитесь Engine running.'
  }
  & docker compose up -d postgres
  if ($LASTEXITCODE -ne 0) {
    throw 'Не удалось запустить локальную PostgreSQL.'
  }
}

function Invoke-Parser([string[]] $ParserArguments) {
  $npmArguments = @(
    'run', 'enrichment:run:local', '--',
    '--input-dir', $script:InputFolder
  ) + $ParserArguments

  Write-Host "`nЗапускаю парсер. Для безопасной остановки нажмите q или Ctrl+C." -ForegroundColor Cyan
  & npm.cmd @npmArguments
  if ($LASTEXITCODE -eq 130) {
    Write-Host 'Парсер безопасно остановлен. Продолжить можно через пункт 6.' -ForegroundColor Yellow
  } elseif ($LASTEXITCODE -ne 0) {
    Write-Host "Парсер завершился с ошибкой. Код: $LASTEXITCODE" -ForegroundColor Red
  } else {
    Write-Host 'Операция завершена успешно.' -ForegroundColor Green
  }
  Read-Host 'Нажмите Enter, чтобы вернуться в меню'
}

function Show-Status {
  Ensure-LocalDatabase
  & npm.cmd run enrichment:status:local
  Read-Host 'Нажмите Enter, чтобы вернуться в меню'
}

function Invoke-Datasheets([switch] $DryRun) {
  Ensure-LocalDatabase
  $arguments = @('run', 'datasheets:process:local', '--', '--limit', '100')
  if ($DryRun) { $arguments += '--dry-run' }

  & npm.cmd @arguments
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Обработка даташитов завершилась с ошибкой. Рабочие старые ссылки сохранены.' -ForegroundColor Red
  } else {
    Write-Host 'Даташиты обработаны успешно.' -ForegroundColor Green
  }
  Read-Host 'Нажмите Enter, чтобы вернуться в меню'
}

if (-not (Test-Path '.env')) {
  throw 'Не найден .env. Сначала запустите windows\INSTALL.cmd.'
}
if (-not (Test-Path 'node_modules')) {
  throw 'Не установлены зависимости. Сначала запустите windows\INSTALL.cmd.'
}

$script:InputFolder = Select-InputFolder
if (-not $script:InputFolder) { exit 0 }

while ($true) {
  Clear-Host
  Write-Host 'ELECTROMAGAZ - ПАРСЕР КАТАЛОГА' -ForegroundColor Cyan
  Write-Host "Папка: $script:InputFolder"
  Write-Host ''
  Write-Host '1 - Проверить все файлы без интернета и записи в БД'
  Write-Host '2 - Пробный запуск на 1 товаре'
  Write-Host '3 - Пробный запуск на 5 товарах'
  Write-Host '4 - Рабочий пакет на 100 товаров'
  Write-Host '5 - Полный запуск всех новых товаров (очень долго)'
  Write-Host '6 - Продолжить прерванный запуск'
  Write-Host '7 - Показать состояние локальной базы'
  Write-Host '8 - Выбрать другую папку с файлами'
  Write-Host '9 - Показать очередь даташитов без загрузки'
  Write-Host '10 - Проверить и загрузить до 100 даташитов в R2'
  Write-Host '0 - Выход'
  Write-Host ''
  $choice = Read-Host 'Введите номер и нажмите Enter'

  try {
    switch ($choice) {
      '1' { Invoke-Parser @('--dry-run', '--no-tui') }
      '2' {
        Ensure-LocalDatabase
        Invoke-Parser @('--limit', '1', '--force-refresh')
      }
      '3' {
        Ensure-LocalDatabase
        Invoke-Parser @('--limit', '5', '--force-refresh')
      }
      '4' {
        Ensure-LocalDatabase
        Invoke-Parser @('--limit', '100')
      }
      '5' {
        $confirmation = Read-Host 'Это может занять недели. Введите ПОЛНЫЙ ЗАПУСК для подтверждения'
        if ($confirmation -ceq 'ПОЛНЫЙ ЗАПУСК') {
          Ensure-LocalDatabase
          Invoke-Parser @()
        }
      }
      '6' {
        Ensure-LocalDatabase
        Invoke-Parser @('--resume')
      }
      '7' { Show-Status }
      '8' {
        $selected = Select-InputFolder
        if ($selected) { $script:InputFolder = $selected }
      }
      '9' { Invoke-Datasheets -DryRun }
      '10' {
        $confirmation = Read-Host 'Для загрузки в Cloudflare R2 введите ЗАГРУЗИТЬ PDF'
        if ($confirmation -ceq 'ЗАГРУЗИТЬ PDF') { Invoke-Datasheets }
      }
      '0' { exit 0 }
      default {
        Write-Host 'Нет такого пункта.' -ForegroundColor Yellow
        Start-Sleep -Seconds 1
      }
    }
  } catch {
    Write-Host "`nОшибка: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host 'Нажмите Enter, чтобы вернуться в меню'
  }
}
