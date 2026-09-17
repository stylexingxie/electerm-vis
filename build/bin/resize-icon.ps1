Add-Type -AssemblyName System.Drawing
$src = Join-Path $PSScriptRoot '..\..\iconrp.png'
$outDir = Join-Path $env:TEMP 'vis-icon-build'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$img = [System.Drawing.Image]::FromFile($src)
Write-Output "source: $([System.Math]::Round($img.Width))x$([System.Math]::Round($img.Height))"
foreach ($size in 256, 128, 64, 48, 32, 16) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $size, $size)
    $out = Join-Path $outDir "icon-$size.png"
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "written $out"
}
$img.Dispose()
Write-Output "OUTDIR=$outDir"
