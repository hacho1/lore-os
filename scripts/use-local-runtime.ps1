$loreosRoot = Split-Path -Parent $PSScriptRoot
$env:PATH = (Join-Path $loreosRoot '.runtime\node') + ';' + $env:PATH
$env:TEMP = Join-Path $loreosRoot '.runtime\temp'
$env:TMP = $env:TEMP
$env:NPM_CONFIG_CACHE = Join-Path $loreosRoot '.runtime\npm-cache'
$env:NPM_CONFIG_PREFIX = Join-Path $loreosRoot '.runtime\npm-global'
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $loreosRoot '.runtime\browsers'
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:GIT_CONFIG_COUNT = '1'
$env:GIT_CONFIG_KEY_0 = 'safe.directory'
$env:GIT_CONFIG_VALUE_0 = $loreosRoot.Replace('\','/')
New-Item -ItemType Directory -Force -Path $env:TEMP,$env:NPM_CONFIG_CACHE,$env:NPM_CONFIG_PREFIX,$env:PLAYWRIGHT_BROWSERS_PATH | Out-Null
Set-Location -LiteralPath $loreosRoot
