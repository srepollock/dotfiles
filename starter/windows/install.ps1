# Installs
## Install PowerShell
winget install Microsoft.PowerShell
## Install OhMyPosh
winget install JanDeDobbeleer.OhMyPosh --source winget

## SetUp OhMyPosh
mkdir C:\Users\$($env:USERNAME)\.omp
cp .\.omp\spencer.omp.json C:\Users\$($env:USERNAME)\.omp\

## Create PowerShell Folders
mkdir C:\Users\$($env:USERNAME)\PowerShell
mkdir C:\Users\$($env:USERNAME)\WindowsPowerShell
## Copy PowerShell Profiles
cp .\Microsoft.PowerShell_profile.ps1 C:\Users\$($env:USERNAME)\PowerShell
cp .\PowerShell\Microsoft.PowerShell_profile.ps1 C:\Users\$($env:USERNAME)\WindowsPowerShell

## Copy WSL Config
cp .\.wslconfig C:\Users\$($env:USERNAME)\.wslconfig