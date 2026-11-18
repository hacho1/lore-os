@echo off
setlocal
cd /d "%~dp0"
set "PATH=%~dp0.runtime\node;%PATH%"
set "TEMP=%~dp0.runtime\temp"
set "TMP=%~dp0.runtime\temp"
set "NPM_CONFIG_CACHE=%~dp0.runtime\npm-cache"
set "NPM_CONFIG_PREFIX=%~dp0.runtime\npm-global"
set "PLAYWRIGHT_BROWSERS_PATH=%~dp0.runtime\browsers"
set "NEXT_TELEMETRY_DISABLED=1"
if not exist "%~dp0.runtime\node\node.exe" (
 echo D-drive Node runtime is missing.
 exit /b 1
)
if "%~1"=="" (
 if exist "%~dp0.next\BUILD_ID" (
  "%~dp0.runtime\node\node.exe" "%~dp0node_modules\next\dist\bin\next" start --hostname 127.0.0.1
 ) else (
  "%~dp0.runtime\node\node.exe" "%~dp0node_modules\next\dist\bin\next" dev --hostname 127.0.0.1
 )
) else (
 "%~dp0.runtime\node\node.exe" "%~dp0.runtime\node\node_modules\npm\bin\npm-cli.js" %*
)
