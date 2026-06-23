$shell = New-Object -ComObject Shell.Application
$folder = $shell.Namespace('C:\Users\19135\Desktop\1')
$file = $folder.ParseName('宅部落宣传视频.mp4')
for ($i = 0; $i -lt 300; $i++) {
    $name = $folder.GetDetailsOf($null, $i)
    $val = $folder.GetDetailsOf($file, $i)
    if ($val -and $val -ne '') {
        Write-Output "${i}: ${name} = ${val}"
    }
}
