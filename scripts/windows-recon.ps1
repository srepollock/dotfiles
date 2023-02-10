Write-Host "Getting the good stuff"
$OutFile=New-Item C:\temp\windows-recon.txt
$OutZip=C:\temp\windows-recon.zip
$FileType="*.exe","*.bak","*.diff","*.trn","*.docx","*.doc","*.xlsx","*.xls","*.pptx","*.ppt","*.zip","*.tar","*.png","*.gif","*.jpg","*.jpeg","*.mp3","*.mp4","*.vlc","*.webm","*.wav","*.mov","*.avi","*.wmv","*.mkv"
$ErrorActionPreference="silentlycontinue"
$i=1
$Drives=Get-PSDrive -PSProvider "FileSystem"
foreach($Drive in $Drives.Root) {
    Write-Progress -Activity "Processing Found Computer Drives" -CurrentOperation $Drive -PercentComplete (($i/$Drives.Count)*100)
    Get-ChildItem -Path $Drive -Recursive -ErrorAction SilentlyContinue | Where-Object {$_.length -gt 524288000} | Sort-Object length | ft fullname,length -auto | ForEach-Object {$_.FullName}>>$OutFile
    Get-ChildItem -Path $Drive -Recursive -Include $FileTypes -ErrorAction SilentlyContinue | ForEach-Object {$_.FullName}>>$OutFile
    $i++
}
Get-Content $OutFile | Select-String -pattern '[|]|(|)|{|}' -notmatch | Set-Content $OutFile
$Compress=Get-Content $OutFile
Compress-Archive -Path $Compress -DestinationPath $OutZip
Write-Host "Done"