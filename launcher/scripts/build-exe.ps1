Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\..\.."
Write-Host "Building AutoGlassERP.exe ..."
$env:GOOS = "windows"
$env:GOARCH = "amd64"
go build -o AutoGlassERP.exe ./launcher/main.go
Write-Host "Build done: AutoGlassERP.exe"
