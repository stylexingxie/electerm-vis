Add-Type -AssemblyName System.Drawing
$root = 'c:/Users/ZhuanZ/Documents/trae_projects/electerm_ori/electerm-5.5.6/electerm-5.5.6'
$src = Join-Path $root 'iconrp.png'
$brand = Join-Path $root 'src/client/assets/brand'

$img = [System.Drawing.Image]::FromFile($src)

# vis.png: brand logo shown on the loading screen (index.pug) and the
# about dialog — use the brand source image directly (500x500)
$vis = Join-Path $brand 'vis.png'
$img.Save($vis, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "written $vis"

# vis-watermark.png: large faded watermark behind the loading screen —
# render the brand image at low alpha onto a transparent canvas
$canvas = 600
$icon = 480
$bmp = New-Object System.Drawing.Bitmap $canvas, $canvas, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$matrix = New-Object System.Drawing.Imaging.ColorMatrix
$matrix.Matrix33 = 0.12
$attrs = New-Object System.Drawing.Imaging.ImageAttributes
$attrs.SetColorMatrix($matrix)
$x = [int](($canvas - $icon) / 2)
$rect = New-Object System.Drawing.Rectangle $x, $x, $icon, $icon
$g.DrawImage($img, $rect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
$g.Dispose()
$wm = Join-Path $brand 'vis-watermark.png'
$bmp.Save($wm, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "written $wm"

$img.Dispose()
