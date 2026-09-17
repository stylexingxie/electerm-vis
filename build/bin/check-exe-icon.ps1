# debug helper: extract the icon embedded in the packaged exe
param(
    [string]$ExePath
)
Add-Type -AssemblyName System.Drawing
if (-not $ExePath) {
    $root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $ExePath = Join-Path $root 'dist\win-unpacked\vis远程工具.exe'
}
if (-not (Test-Path $ExePath)) {
    throw "exe not found: $ExePath"
}
$i = [System.Drawing.Icon]::ExtractAssociatedIcon($ExePath)
$out = Join-Path $env:TEMP 'vis-exe-icon.png'
$i.ToBitmap().Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "saved $out"
