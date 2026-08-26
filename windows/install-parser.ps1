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
    Write-Host "$Title is already installed." -ForegroundColor Green
    return $false
  }
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw 'winget is missing. Install App Installer from Microsoft Store.'
  }

  Write-Step "Installing $Title"
  & winget install --id $PackageId --exact --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "winget failed to install $Title. Exit code: $LASTEXITCODE"
  }
  Refresh-Path
  return -not (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Wait-ForDocker {
  $dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
  & docker info *> $null
  if ($LASTEXITCODE -ne 0 -and (Test-Path $dockerDesktop)) {
    Write-Host 'Starting Docker Desktop...'
    Start-Process $dockerDesktop
  }

  for ($attempt = 1; $attempt -le 90; $attempt++) {
    & docker info *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Host 'Docker is ready.' -ForegroundColor Green
      return
    }
    Start-Sleep -Seconds 2
  }
  throw 'Docker did not start. Open Docker Desktop and wait for Engine running.'
}

Write-Host 'ELECTROMAGAZ PARSER - FIRST-TIME SETUP' -ForegroundColor Cyan
Write-Host "Project folder: $ProjectRoot"

$restartRequired = $false
$restartRequired = (Install-Package 'node' 'OpenJS.NodeJS.LTS' 'Node.js LTS') -or $restartRequired
$restartRequired = (Install-Package 'docker' 'Docker.DockerDesktop' 'Docker Desktop') -or $restartRequired
if ($restartRequired) {
  Write-Host "`nRestart Windows and run INSTALL.cmd again." -ForegroundColor Yellow
  exit 10
}

if (-not (Test-Path '.env')) {
  Write-Step 'Creating local settings'
  Copy-Item '.env.example' '.env'
  Write-Host 'Created local .env. Git ignores this file.' -ForegroundColor Green
}

Write-Step 'Installing project dependencies'
& npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed: $LASTEXITCODE" }

Write-Step 'Starting local PostgreSQL'
Wait-ForDocker
& docker compose up -d postgres
if ($LASTEXITCODE -ne 0) { throw "docker compose failed: $LASTEXITCODE" }

Write-Step 'Waiting for PostgreSQL health check'
$health = ''
for ($attempt = 1; $attempt -le 60; $attempt++) {
  $health = & docker inspect --format '{{.State.Health.Status}}' electromagaz_db 2>$null
  if ($health -eq 'healthy') { break }
  Start-Sleep -Seconds 2
}
if ($health -ne 'healthy') { throw 'PostgreSQL did not become healthy.' }

Write-Step 'Applying the local database schema'
& npm.cmd run db:sync-local-password
if ($LASTEXITCODE -ne 0) { throw 'Failed to synchronize the local database password.' }
& npm.cmd run db:migrate:local
if ($LASTEXITCODE -ne 0) { throw 'Failed to apply local database migrations.' }

Write-Host "`nSetup completed. Run windows\RUN-PARSER.cmd." -ForegroundColor Green
