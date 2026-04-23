@echo off
setlocal
cd /d "%~dp0\..\.."
echo Building AutoGlassERP.exe ...
set GOOS=windows
set GOARCH=amd64
go build -o AutoGlassERP.exe ./launcher/main.go
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)
echo Build done: AutoGlassERP.exe
endlocal
