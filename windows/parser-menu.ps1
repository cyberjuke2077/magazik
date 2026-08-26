$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ParserPower {
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern uint SetThreadExecutionState(uint flags);
}
'@

function Select-InputFolder {
  Add-Type -AssemblyName System.Windows.Forms
  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = 'Select the folder containing supplier CSV/XLS/XLSX files'
  $dialog.ShowNewFolderButton = $false
  if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    return $null
  }
  return $dialog.SelectedPath
}

function Ensure-LocalDatabase {
  & docker info *> $null
  if ($LASTEXITCODE -ne 0) {
    throw 'Docker is not running. Open Docker Desktop and wait for Engine running.'
  }
  & docker compose up -d postgres
  if ($LASTEXITCODE -ne 0) { throw 'Failed to start local PostgreSQL.' }
}

function Set-ParserAwake([bool] $Enabled) {
  $continuous = [Convert]::ToUInt32('80000000', 16)
  $systemRequired = [uint32]0x00000001
  $flags = if ($Enabled) { $continuous -bor $systemRequired } else { $continuous }
  $result = [ParserPower]::SetThreadExecutionState($flags)
  if ($result -eq 0) { Write-Warning 'Could not disable automatic sleep.' }
}

function Show-Status {
  Ensure-LocalDatabase
  & npm.cmd run enrichment:status:local
  if ($LASTEXITCODE -ne 0) { throw 'Failed to read parser status.' }
}

function Invoke-Parser {
  param(
    [string[]] $ParserArguments,
    [bool] $UseLocalDatabase = $true
  )
  if ($UseLocalDatabase) { Ensure-LocalDatabase }
  $scriptName = if ($UseLocalDatabase) { 'enrichment:run:local' } else { 'enrichment:run' }
  $npmArguments = @('run', $scriptName, '--', '--input-dir', $script:InputFolder) + $ParserArguments

  Write-Host "`nStarting parser. Press q for a safe stop." -ForegroundColor Cyan
  $parserExit = 1
  Set-ParserAwake $true
  try {
    & npm.cmd @npmArguments
    $parserExit = $LASTEXITCODE
  } finally {
    Set-ParserAwake $false
  }

  if ($parserExit -eq 130) {
    Write-Host 'Parser stopped safely. Use Resume interrupted run.' -ForegroundColor Yellow
  } elseif ($parserExit -ne 0) {
    Write-Host "Parser failed. Exit code: $parserExit" -ForegroundColor Red
  } else {
    Write-Host 'Operation completed successfully.' -ForegroundColor Green
  }
  if ($UseLocalDatabase) { Show-Status }
  Read-Host 'Press Enter to return to the menu'
}

if (-not (Test-Path '.env')) { throw 'Missing .env. Run windows\INSTALL.cmd first.' }
if (-not (Test-Path 'node_modules')) { throw 'Missing dependencies. Run windows\INSTALL.cmd first.' }

$script:InputFolder = Select-InputFolder
if (-not $script:InputFolder) { exit 0 }

while ($true) {
  Clear-Host
  Write-Host 'ELECTROMAGAZ - CATALOG PARSER' -ForegroundColor Cyan
  Write-Host "Input folder: $script:InputFolder"
  Write-Host ''
  Write-Host '1 - Validate all files offline (dry-run)'
  Write-Host '2 - Live pilot: 1 product'
  Write-Host '3 - Live pilot: 5 products'
  Write-Host '4 - Process next 100 products requiring an update'
  Write-Host '5 - Process the full remaining list'
  Write-Host '6 - Resume interrupted run'
  Write-Host '7 - Show local parser status'
  Write-Host '8 - Show unresolved products'
  Write-Host '9 - Select another input folder'
  Write-Host '0 - Exit'
  $choice = Read-Host 'Select an option'

  try {
    switch ($choice) {
      '1' { Invoke-Parser -ParserArguments @('--dry-run', '--no-tui') -UseLocalDatabase $false }
      '2' { Invoke-Parser -ParserArguments @('--limit', '1', '--force-refresh') }
      '3' { Invoke-Parser -ParserArguments @('--limit', '5', '--force-refresh') }
      '4' { Invoke-Parser -ParserArguments @('--limit', '100') }
      '5' {
        $confirmation = Read-Host 'Type RUN ALL to confirm a long full run'
        if ($confirmation -ceq 'RUN ALL') { Invoke-Parser -ParserArguments @() }
      }
      '6' { Invoke-Parser -ParserArguments @('--resume') }
      '7' { Show-Status; Read-Host 'Press Enter to return to the menu' }
      '8' {
        Ensure-LocalDatabase
        & npm.cmd run enrichment:status:local -- --unresolved
        Read-Host 'Press Enter to return to the menu'
      }
      '9' {
        $selected = Select-InputFolder
        if ($selected) { $script:InputFolder = $selected }
      }
      '0' { exit 0 }
      default { Write-Host 'Unknown option.' -ForegroundColor Yellow; Start-Sleep -Seconds 1 }
    }
  } catch {
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host 'Press Enter to return to the menu'
  }
}
