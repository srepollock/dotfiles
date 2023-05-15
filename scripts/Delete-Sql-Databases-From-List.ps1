<#
.Description
Deletes all local databases named from list.
#>
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 3
$sqlDeleteCommand = "
USE MASTER
GO
ALTER DATABASE [VARIABLE_DATABASE_NAME] SET single_user WITH ROLLBACKS immediate
GO
DROP DATABASE IF EXISTS [VARIABLE_DATABASE_NAME]
"
Write-Host "Collecting Databases"
$databases = Invoke-Sqlcmd -Database "Master" -Query "SELECT name, database_id, create_date FROM sys.database" | Where-Object { $_.name -like "*"} | Select-Object -Property name | foreach {$_.name}
if (!$databases) {
    Write-Host "Script did not find any databases. Exiting."
    exit 1
}
Write-Host "Databases: $databases"
foreach ($database in $databases) {
    Write-Host "Deleting $database"
    $tmp = $sqlDeleteCommand
    $tmp = $tmp -replace "VARIABLE_DATABASE_NAME", "$database"
    Invoke-Sqlcmd -Database "Master" -Query $tmp
}
Write-Host "Deleted all databases"