Add-Type -AssemblyName System.Drawing
$exe = 'c:/Users/ZhuanZ/Documents/trae_projects/electerm_ori/electerm-5.5.6/electerm-5.5.6/dist/win-unpacked/vis远程工具.exe'
$i = [System.Drawing.Icon]::ExtractAssociatedIcon($exe)
$i.ToBitmap().Save('c:/Users/ZhuanZ/Documents/trae_projects/electerm_ori/electerm-5.5.6/electerm-5.5.6/temp-exe-icon.png', [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'saved'
