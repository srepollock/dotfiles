$env:CUSTOM_POSH_THEMES_PATH = $env:USERPROFILE + '\.omp'
oh-my-posh init pwsh --config "$env:CUSTOM_POSH_THEMES_PATH\spencer.omp.json" | Invoke-Expression

Set-PSReadLineOption -EditMode Emacs
Set-PSReadlineKeyHandler -Key Tab -Function MenuComplete
Set-PSReadLineKeyHandler -Chord Ctrl+LeftArrow -Function BackwardWord
Set-PSReadLineKeyHandler -Chord Ctrl+RightArrow -Function ForwardWord

Set-PSReadLineOption -PredictionSource History
Set-PSReadLineOption -PredictionViewStyle ListView

Import-Module -Name Terminal-Icons
Import-Module -Name posh-git