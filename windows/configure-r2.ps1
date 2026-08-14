$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot '.env'

if (-not (Test-Path $EnvFile)) {
  throw 'Не найден .env. Сначала запустите windows\INSTALL.cmd.'
}

function Set-EnvValue([string] $Name, [string] $Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Значение $Name не может быть пустым."
  }
  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.AddRange([string[]](Get-Content -LiteralPath $EnvFile))
  $index = -1
  for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
    if ($lines[$lineIndex] -match "^$([regex]::Escape($Name))=") {
      $index = $lineIndex
      break
    }
  }
  $line = "$Name=$Value"
  if ($index -ge 0) { $lines[$index] = $line } else { $lines.Add($line) }
  Set-Content -LiteralPath $EnvFile -Value $lines -Encoding utf8
}

Write-Host 'НАСТРОЙКА CLOUDFLARE R2' -ForegroundColor Cyan
Write-Host 'Значения возьмите в Cloudflare Dashboard -> R2 -> Manage R2 API Tokens.'
Write-Host 'Секрет будет скрыт при вводе и останется только в локальном .env.'
Write-Host ''

$endpoint = Read-Host 'S3 API endpoint'
$bucket = Read-Host 'Имя bucket'
$publicUrl = Read-Host 'Public Development URL или собственный публичный домен'
$accessKey = Read-Host 'Access Key ID'
$secureSecret = Read-Host 'Secret Access Key' -AsSecureString
$secret = [System.Net.NetworkCredential]::new('', $secureSecret).Password

Set-EnvValue 'R2_ENDPOINT' $endpoint.TrimEnd('/')
Set-EnvValue 'R2_BUCKET' $bucket
Set-EnvValue 'R2_PUBLIC_URL' $publicUrl.TrimEnd('/')
Set-EnvValue 'R2_ACCESS_KEY_ID' $accessKey
Set-EnvValue 'R2_SECRET_ACCESS_KEY' $secret

Write-Host ''
Write-Host 'R2 настроен. Ключи не попали в GitHub.' -ForegroundColor Green
