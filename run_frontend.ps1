Set-Location "$PSScriptRoot\frontend"
if ((Test-Path .env.local.example) -and (-not (Test-Path .env.local))) {
  Copy-Item .env.local.example .env.local
}
npm run dev -- --port 3000
