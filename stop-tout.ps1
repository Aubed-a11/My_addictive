# Arrete proprement les 10 processus Java du backend lances par start-tout.ps1
# (l'app mobile/Expo s'arrete avec Ctrl+C dans son propre terminal).
Set-Location -Path $PSScriptRoot

if (Test-Path ".pids-backend") {
    Get-Content ".pids-backend" | ForEach-Object {
        $parties = $_ -split "="
        if ($parties.Length -eq 2) {
            $nom = $parties[0]
            $processusId = $parties[1]
            try {
                Stop-Process -Id $processusId -Force -ErrorAction Stop
                Write-Host "OK  $nom arrete (PID $processusId)" -ForegroundColor Green
            } catch {
                Write-Host "!!  $nom (PID $processusId) deja arrete ou introuvable" -ForegroundColor Yellow
            }
        }
    }
    Remove-Item ".pids-backend" -ErrorAction SilentlyContinue
} else {
    Write-Host "Aucun fichier .pids-backend trouve : le backend n'a peut-etre pas ete demarre avec start-tout.ps1, ou a deja ete arrete." -ForegroundColor Yellow
}

# Filet de securite : au cas ou .pids-backend serait absent/perime (ex. terminal ferme
# brutalement lors d'un essai precedent), on rattrape aussi tout java.exe dont la ligne
# de commande pointe vers un des jars de ce projet, pour eviter des ports bloques au
# prochain demarrage.
$racineEchappee = [regex]::Escape($PSScriptRoot)
$processusOrphelins = Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match $racineEchappee }
foreach ($p in $processusOrphelins) {
    try {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
        Write-Host "OK  processus java orphelin arrete (PID $($p.ProcessId))" -ForegroundColor Green
    } catch { }
}

Write-Host "Backend arrete. (Les bases H2 dans .\data\ sont conservees.)" -ForegroundColor Green
