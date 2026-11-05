@echo off
setlocal
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
if exist "Aula Fantasma.exe" (
  start "" "Aula Fantasma.exe"
  exit /b 0
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo No se encuentra la app compilada ni Electron. Consulta README.md.
  pause
  exit /b 1
)
set ELECTRON_RUN_AS_NODE=
start "" "node_modules\electron\dist\electron.exe" .
