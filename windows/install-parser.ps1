$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Write-Step([string] $Message) {
  Write-Host "`n[$Message]" -ForegroundColor Cyan
}

function Refresh-Path {
  $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machinePath;$userPath"
}

function Install-Package([string] $Command, [string] $PackageId, [string] $Title) {
  if (Get-Command $Command -ErrorAction SilentlyContinue) {
    Write-Host "$Title уже установлен." -ForegroundColor Green
    return $false
  }

  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw 'Не найден winget. Установите App Installer из Microsoft Store и снова запустите INSTALL.cmd.'
  }

  Write-Step "Устанавливаю $Title"
  & winget install --id $PackageId --exact --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "winget не смог установить $Title. Код: $LASTEXITCODE"
  }
  Refresh-Path
  return -not (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Start-DockerDesktop {
  $dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
  if (Test-Path $dockerDesktop) {
    Write-Host 'Запускаю Docker Desktop...'
    Start-Process $dockerDesktop
  }

  for ($attempt = 1; $attempt -le 90; $attempt++) {
    & docker info *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Host 'Docker готов.' -ForegroundColor Green
      return
    }
    Start-Sleep -Seconds 2
  }
  throw 'Docker не запустился. Откройте Docker Desktop, дождитесь Engine running и снова запустите INSTALL.cmd.'
}

Write-Host 'Electromagaz - первичная установка парсера' -ForegroundColor Cyan
Write-Host "Папка проекта: $ProjectRoot"

$restartRequired = $false
$restartRequired = (Install-Package 'node' 'OpenJS.NodeJS.LTS' 'Node.js LTS') -or $restartRequired
$restartRequired = (Install-Package 'docker' 'Docker.DockerDesktop' 'Docker Desktop') -or $restartRequired

if ($restartRequired) {
  Write-Host "`nКомпоненты установлены, но Windows ещё не видит их в этой сессии." -ForegroundColor Yellow
  Write-Host 'Перезагрузите компьютер и снова запустите INSTALL.cmd.' -ForegroundColor Yellow
  exit 10
}

if (-not (Test-Path '.env')) {
  Write-Step 'Создаю локальные настройки'
  Copy-Item '.env.example' '.env'
  Write-Host 'Создан локальный .env. В Git он не попадёт.' -ForegroundColor Green
}

Write-Step 'Устанавливаю зависимости проекта'
& npm.cmd ci
if ($LASTEXITCODE -ne 0) {
  throw "npm ci завершился с кодом $LASTEXITCODE"
}

Write-Step 'Запускаю локальную базу данных'
Start-DockerDesktop
& docker compose up -d postgres
if ($LASTEXITCODE -ne 0) {
  throw "docker compose завершился с кодом $LASTEXITCODE"
}

Write-Step 'Жду готовности PostgreSQL'
for ($attempt = 1; $attempt -le 60; $attempt++) {
  $health = & docker inspect --format '{{.State.Health.Status}}' electromagaz_db 2>$null
  if ($health -eq 'healthy') { break }
  Start-Sleep -Seconds 2
}
if ($health -ne 'healthy') {
  throw 'PostgreSQL не перешёл в состояние healthy.'
}

Write-Step 'Применяю схему базы данных'
& npm.cmd run db:sync-local-password
if ($LASTEXITCODE -ne 0) { throw 'Не удалось синхронизировать пароль PostgreSQL.' }
& npm.cmd run db:migrate:local
if ($LASTEXITCODE -ne 0) { throw 'Не удалось применить миграции PostgreSQL.' }

Write-Host "`nГотово. Запускайте windows\RUN-PARSER.cmd." -ForegroundColor Green
