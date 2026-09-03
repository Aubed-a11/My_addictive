# Demarre TOUT en une seule commande, SANS DOCKER : compile les 10
# microservices avec Maven, les lance directement en Java (bases de
# donnees H2 embarquees, pas de Postgres/Redis/RabbitMQ/MinIO a installer),
# puis lance l'app mobile (Expo) avec detection automatique de l'IP locale.
#
# Usage (PowerShell) : .\start-tout.ps1
# Usage (cmd)         : start-tout.bat
#
# Prerequis : Java 17+ (JDK), Maven, Node.js + npm, l'app Expo Go sur ton
# telephone (ou un emulateur Android/iOS).

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Info($msg)      { Write-Host "-> $msg" -ForegroundColor Cyan }
function Succes($msg)    { Write-Host "OK  $msg" -ForegroundColor Green }
function Attention($msg) { Write-Host "!!  $msg" -ForegroundColor Yellow }
function Erreur($msg)    { Write-Host "X   $msg" -ForegroundColor Red }

# ---------- 0. Verification des prerequis ----------
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Erreur "Java n'est pas installe ou pas dans le PATH. Installe un JDK 17+ (ex. https://adoptium.net) puis relance ce script."
    exit 1
}
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    Erreur "Maven n'est pas installe ou pas dans le PATH. Installe Maven (https://maven.apache.org/download.cgi) puis relance ce script."
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Erreur "Node.js/npm n'est pas installe. Installe Node.js (https://nodejs.org) puis relance ce script."
    exit 1
}

# ---------- 0bis. Detection de ports deja occupes (execution precedente mal arretee) ----------
# Si start-tout a deja tourne sans passer par stop-tout entre-temps, d'anciens
# processus java.exe orphelins peuvent encore occuper les ports necessaires,
# empechant les nouveaux services de demarrer correctement (meme symptome que
# "la gateway ne repond pas", pour une toute autre raison).
$portsRequis = @(8090, 8091, 8082, 8083, 8084, 8085, 8086, 8087, 8761, 8888)
$portsOccupes = @()
foreach ($port in $portsRequis) {
    $ecoute = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($ecoute) { $portsOccupes += $port }
}
if ($portsOccupes.Count -gt 0) {
    Attention "Ces ports sont deja occupes (probablement une precedente execution jamais arretee proprement) :"
    Attention "  $($portsOccupes -join ', ')"
    Info "Nettoyage automatique : recherche des processus java.exe orphelins de ce projet..."

    # Meme logique que stop-tout.ps1 : on ne tue que les java.exe dont la ligne de
    # commande pointe vers UN JAR DE CE PROJET precis (jamais un java.exe d'un
    # autre logiciel installe sur la machine), pour rattraper les cas ou
    # l'utilisateur a ferme le terminal sans passer par stop-tout.bat.
    $racineEchappee = [regex]::Escape($PSScriptRoot)
    $processusOrphelins = Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match $racineEchappee }

    if ($processusOrphelins) {
        foreach ($p in $processusOrphelins) {
            try {
                Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
                Succes "  Processus java orphelin arrete (PID $($p.ProcessId))"
            } catch { }
        }
        Info "Attente de la liberation des ports..."
        Start-Sleep -Seconds 3
    } else {
        Attention "Aucun processus java.exe de ce projet trouve : le port est occupe par un AUTRE programme"
        Attention "installe sur cette machine (rien a voir avec ce projet). Verifie avec :"
        Attention "  netstat -ano | findstr :$($portsOccupes[0])"
        Attention "puis identifie le programme correspondant au PID affiche (tasklist | findstr <PID>)."
    }

    # Re-verifie apres tentative de nettoyage, pour prevenir clairement si ca persiste.
    $portsEncoreOccupes = @()
    foreach ($port in $portsRequis) {
        $ecoute = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($ecoute) { $portsEncoreOccupes += $port }
    }
    if ($portsEncoreOccupes.Count -gt 0) {
        Attention "Toujours occupes apres nettoyage automatique : $($portsEncoreOccupes -join ', ')"
        Attention "Ce sont probablement des programmes tiers (pas ce projet). On continue quand meme,"
        Attention "mais le service correspondant risque de ne pas demarrer."
    } else {
        Succes "Tous les ports sont maintenant libres."
    }
}

# ---------- 0ter. Avertissement si le chemin du projet contient des espaces/parentheses ----------
# Ex. dossier telecharge en double par le navigateur ("projet (1)") : source frequente
# de plantages avec les outils Java/Maven sous Windows.
if ($PSScriptRoot -match '[\s()]') {
    Attention "Le chemin du projet contient un espace ou une parenthese :"
    Attention "  $PSScriptRoot"
    Attention "Cela peut provoquer des erreurs de demarrage. Si un service refuse de se lancer,"
    Attention "deplace tout le dossier vers un chemin simple, par exemple C:\dev\myaddictive"
}

# ---------- 0quater. JAVA_HOME : preferer un JDK 17 si present, sinon utiliser celui du PATH ----------
# Ce projet (Spring Boot 3.2.5) cible Java 17. Avec un JDK plus recent (21, 23...),
# la compilation peut reussir mais l'etape de "repackaging" en jar executable
# echoue parfois silencieusement (le jar produit n'a alors pas de manifeste
# executable, erreur "no main manifest attribute" au demarrage). On cherche donc
# activement un JDK 17 dans les emplacements d'installation courants avant de se
# rabattre sur le java du PATH, plutot que de forcer l'utilisateur a modifier
# durablement ses variables d'environnement Windows (ce qui echoue sur certaines
# machines restreintes : erreur "acces au registre refuse").
$jdk17Candidats = @(
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Microsoft\jdk-17*",
    "C:\Program Files\Zulu\zulu-17*"
)
$jdk17Trouve = $jdk17Candidats | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } | Select-Object -First 1

if ($jdk17Trouve -and (Test-Path (Join-Path $jdk17Trouve.FullName "bin\java.exe"))) {
    $env:JAVA_HOME = $jdk17Trouve.FullName
    Info "JDK 17 trouve et utilise pour cette session : $env:JAVA_HOME"
} elseif (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
    $commandeJava = Get-Command java -ErrorAction SilentlyContinue
    if ($commandeJava) {
        $dossierBin = Split-Path $commandeJava.Source -Parent
        $env:JAVA_HOME = Split-Path $dossierBin -Parent
        Info "JAVA_HOME auto-detecte pour cette session : $env:JAVA_HOME"
        # java -version ecrit sur la sortie erreur par convention (particularite connue
        # de Java, pas un vrai probleme) : on assouplit temporairement la gestion
        # d'erreur pour cet appel precis, sinon $ErrorActionPreference="Stop" le
        # transforme a tort en erreur bloquante qui arrete tout le script.
        $ancienEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $versionBrute = & "$env:JAVA_HOME\bin\java.exe" -version 2>&1 | Out-String
        $ErrorActionPreference = $ancienEAP
        $correspondance = [regex]::Match($versionBrute, 'version "(\d+)')
        if ($correspondance.Success -and [int]$correspondance.Groups[1].Value -gt 21) {
            Attention "JDK detecte : version $($correspondance.Groups[1].Value). Ce projet cible Java 17."
            Attention "Si le backend echoue avec 'no main manifest attribute', installe un JDK 17"
            Attention "(https://adoptium.net/temurin/releases/?version=17) : le script le detectera automatiquement."
        }
    } else {
        Erreur "Impossible de detecter automatiquement l'installation de Java."
        exit 1
    }
} else {
    Info "JAVA_HOME deja valide : $env:JAVA_HOME"
}

# ---------- 1. Variables d'environnement (.env facultatif) ----------
if (Test-Path ".env") {
    Info "Chargement de .env dans l'environnement du backend."
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#=][^=]*)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
        }
    }
} else {
    Info "Aucun .env trouve, valeurs par defaut utilisees (voir .env.example)."
}

# ---------- 1bis. Nettoyage de fichiers obsoletes (au cas ou une ancienne version du
# projet aurait ete extraite par-dessus, ce qui laisse trainer d'anciens fichiers
# RabbitMQ qui ne compilent plus depuis leur suppression du projet). ----------
$fichiersObsoletes = @(
    "musique-service\src\main\java\bj\myaddictive\musique\config\RabbitMQConsumerConfig.java",
    "musique-service\src\main\java\bj\myaddictive\musique\messaging\PaiementConfirmeListener.java",
    "musique-service\src\main\java\bj\myaddictive\musique\messaging\PaiementConfirmeEvent.java",
    "live-service\src\main\java\bj\myaddictive\live\config\RabbitMQConsumerConfig.java",
    "live-service\src\main\java\bj\myaddictive\live\messaging\PaiementConfirmeListener.java",
    "live-service\src\main\java\bj\myaddictive\live\messaging\PaiementConfirmeEvent.java",
    "votes-service\src\main\java\bj\myaddictive\votes\config\RabbitMQConsumerConfig.java",
    "votes-service\src\main\java\bj\myaddictive\votes\messaging\PaiementConfirmeListener.java",
    "votes-service\src\main\java\bj\myaddictive\votes\messaging\PaiementConfirmeEvent.java",
    "boutique-service\src\main\java\bj\myaddictive\boutique\config\RabbitMQConsumerConfig.java",
    "boutique-service\src\main\java\bj\myaddictive\boutique\messaging\PaiementConfirmeListener.java",
    "boutique-service\src\main\java\bj\myaddictive\boutique\messaging\PaiementConfirmeEvent.java",
    "paiement-service\src\main\java\bj\myaddictive\paiement\config\RabbitMQConfig.java",
    "paiement-service\src\main\java\bj\myaddictive\paiement\messaging\PaiementEventPublisher.java"
)
$nettoyes = 0
foreach ($f in $fichiersObsoletes) {
    if (Test-Path $f) {
        Remove-Item $f -Force
        $nettoyes++
    }
}
if ($nettoyes -gt 0) {
    Attention "$nettoyes ancien(s) fichier(s) RabbitMQ obsolete(s) supprime(s) (restes d'une extraction precedente)."
}

# ---------- 2. Compilation de tous les microservices (un seul build multi-module) ----------
Info "Compilation des 10 microservices avec Maven (premiere fois : peut prendre plusieurs minutes)..."
mvn -q -DskipTests clean package
if ($LASTEXITCODE -ne 0) {
    Erreur "La compilation Maven a echoue. Regarde le message d'erreur ci-dessus (souvent une erreur de compilation Java a corriger)."
    exit 1
}
Succes "Compilation terminee."

# ---------- 2bis. Verification immediate que chaque .jar est bien executable ----------
# Plutot que de decouvrir 5 minutes plus tard, via un message crypte dans les logs,
# qu'un .jar n'a pas ete correctement "repackage" par Spring Boot (erreur "no main
# manifest attribute"), on verifie tout de suite le manifeste de chacun des 10 jars.
Info "Verification que les 10 jars sont bien executables..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
$servicesAttendus = @("discovery-service","config-service","compte-service","media-service","musique-service","live-service","votes-service","boutique-service","paiement-service","gateway-service")
$jarsInvalides = @()
foreach ($service in $servicesAttendus) {
    $jar = Get-ChildItem -Path "$PSScriptRoot\$service\target" -Filter "*.jar" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notlike "*sources*" } | Select-Object -First 1
    if (-not $jar) {
        $jarsInvalides += "$service (jar introuvable)"
        continue
    }
    $archive = $null
    try {
        $archive = [System.IO.Compression.ZipFile]::OpenRead($jar.FullName)
        $manifeste = $archive.Entries | Where-Object { $_.FullName -eq "META-INF/MANIFEST.MF" }
        $contientMainClass = $false
        if ($manifeste) {
            $lecteur = New-Object System.IO.StreamReader($manifeste.Open())
            $contenuManifeste = $lecteur.ReadToEnd()
            $lecteur.Close()
            $contientMainClass = $contenuManifeste -match "Main-Class:"
        }
        if (-not $contientMainClass) {
            $jarsInvalides += "$service (jar present mais sans manifeste executable, taille : $([math]::Round($jar.Length/1MB,1)) Mo)"
        }
    } catch {
        $jarsInvalides += "$service (jar illisible/corrompu)"
    } finally {
        if ($archive) { $archive.Dispose() }
    }
}

if ($jarsInvalides.Count -gt 0) {
    Erreur "Ces jars ne sont pas des executables Spring Boot valides :"
    foreach ($j in $jarsInvalides) { Erreur "  - $j" }
    Erreur ""
    Erreur "Causes les plus frequentes :"
    Erreur "  1. Un JDK trop recent (ce projet cible Java 17) : verifie le message JDK ci-dessus."
    Erreur "  2. Un antivirus (Windows Defender ou autre) qui bloque/modifie le jar pendant sa creation :"
    Erreur "     essaie d'ajouter une exclusion pour ce dossier dans les parametres antivirus."
    Erreur "  3. Un ancien processus java.exe encore actif qui verrouille le fichier :"
    Erreur "     ouvre le Gestionnaire des taches, termine tous les 'java.exe', puis relance ce script."
    Erreur ""
    Erreur "Taille normale d'un jar Spring Boot execute : entre 20 et 60 Mo (toutes les dependances incluses)."
    exit 1
}
Succes "Les 10 jars sont valides et executables."

# ---------- 3. Lancement natif des services (H2 embarque, pas d'infra externe requise) ----------
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
$racine = $PSScriptRoot
$script:pidsBackend = @()

function Lancer-Service($nom) {
    $jar = Get-ChildItem -Path "$racine\$nom\target" -Filter "*.jar" | Where-Object { $_.Name -notlike "*sources*" } | Select-Object -First 1
    if (-not $jar) {
        Erreur "Jar introuvable pour $nom (le build a-t-il reussi ?)."
        return
    }
    # Le chemin du .jar est enveloppe explicitement entre guillemets echappes : sans
    # cela, un chemin contenant des espaces (ex. dossier telecharge en double, du
    # style "Downloads\projet (1)") coupe l'argument et java ne trouve plus le fichier.
    $argumentJar = "-jar `"$($jar.FullName)`""
    $processus = Start-Process -FilePath "$env:JAVA_HOME\bin\java.exe" -ArgumentList $argumentJar `
        -WorkingDirectory $racine `
        -RedirectStandardOutput "logs\$nom.log" -RedirectStandardError "logs\$nom.err.log" `
        -WindowStyle Hidden -PassThru
    $script:pidsBackend += "$nom=$($processus.Id)"
    Info "$nom demarre (PID $($processus.Id)), logs dans logs\$nom.log"
}

Info "Lancement de l'annuaire de services (Eureka)..."
Lancer-Service "discovery-service"
Start-Sleep -Seconds 12

Info "Lancement de la configuration centralisee..."
Lancer-Service "config-service"

# Attente active plutot qu'un delai fixe : un simple "sleep" de quelques secondes
# peut etre trop court sur une machine lente, et comme le port de chaque service
# n'est normalement connu QUE via config-service (voir plus haut), demarrer les
# microservices metier trop tot les ferait tous demarrer sur le port 8080 par
# defaut de Spring Boot, en collision les uns avec les autres.
Info "Attente que la configuration centralisee soit prete..."
$configPret = $false
for ($i = 0; $i -lt 20; $i++) {
    try {
        $reponse = Invoke-WebRequest -Uri "http://localhost:8888/actuator/health" -UseBasicParsing -TimeoutSec 2
        if ($reponse.StatusCode -eq 200) { $configPret = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (-not $configPret) {
    Attention "config-service ne repond pas encore apres 40 secondes ; on continue quand meme,"
    Attention "mais les services suivants risquent de mal demarrer (voir server.port en repli local desormais)."
}

Info "Lancement des 7 microservices metier (compte, media, musique, live, votes, boutique, paiement)..."
foreach ($service in @("compte-service","media-service","musique-service","live-service","votes-service","boutique-service","paiement-service")) {
    Lancer-Service $service
}
Start-Sleep -Seconds 15

Info "Lancement de la gateway..."
Lancer-Service "gateway-service"
Start-Sleep -Seconds 10

# Sauvegarde des PID pour pouvoir tout arreter proprement plus tard.
$script:pidsBackend | Set-Content -Path ".pids-backend"
Succes "Les 10 services sont lances. Logs consultables dans le dossier logs\."

# ---------- 4. Attente que la gateway reponde ----------
Info "Verification que la gateway repond (peut prendre 1 a 2 minutes le temps qu'Eureka enregistre tous les services)..."
$pret = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $reponse = Invoke-WebRequest -Uri "http://localhost:8090/actuator/health" -UseBasicParsing -TimeoutSec 3
        if ($reponse.StatusCode -eq 200) { $pret = $true; break }
    } catch { }
    Start-Sleep -Seconds 5
    Write-Host "." -NoNewline
}
Write-Host ""
if (-not $pret) {
    Attention "La gateway ne repond pas encore. Regarde logs\gateway-service.err.log et logs\discovery-service.err.log si l'app mobile n'arrive pas a se connecter."
} else {
    Succes "Backend operationnel."
}
Succes "Eureka (annuaire des services) : http://localhost:8761"
Succes "Pour arreter le backend : .\stop-tout.ps1 (ou stop-tout.bat)"

# ---------- 5. Detection de l'IP locale (pour un telephone physique en Wi-Fi) ----------
Info "Detection de l'adresse IP locale de cette machine..."
$ipLocale = $null
try {
    $ipLocale = (Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.InterfaceAlias -match "Wi-Fi|Wireless|Ethernet" -and $_.IPAddress -notmatch "^169\.|^127\." } |
        Select-Object -First 1 -ExpandProperty IPAddress)
} catch { }

if (-not $ipLocale) {
    Attention "Impossible de detecter automatiquement l'IP locale. Utilisation de localhost (ne fonctionnera que sur emulateur, pas sur un telephone physique). Tu peux la trouver toi-meme avec 'ipconfig' (regarde 'Adresse IPv4' de ta carte Wi-Fi)."
    $ipLocale = "localhost"
} else {
    Succes "IP locale detectee : $ipLocale"
}

# ---------- 6. Config de l'app mobile ----------
Set-Location "mobile-app"
"API_BASE_URL=http://${ipLocale}:8090" | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
Info "mobile-app\.env mis a jour avec API_BASE_URL=http://${ipLocale}:8090"
Attention "Sur emulateur Android, l'app utilisera automatiquement 10.0.2.2 a la place si besoin (voir README)."

if (-not (Test-Path "node_modules")) {
    Info "Installation des dependances de l'app mobile (premiere fois seulement)..."
    npm install
} elseif ((Get-Item "package.json").LastWriteTime -gt (Get-Item "node_modules").LastWriteTime) {
    # package.json a change depuis la derniere installation (ex. nouvelle
    # dependance ajoutee dans un zip mis a jour) : sans ca, npm ne serait
    # jamais relance et Expo echouerait au demarrage avec un module manquant.
    Info "package.json plus recent que node_modules (nouvelle dependance ajoutee) : reinstallation..."
    npm install
}

# ---------- 7. Lancement du dashboard admin (en arriere-plan, sa propre fenetre) ----------
Set-Location $racine
$dossierAdmin = Join-Path $racine "admin-dashboard"
if (Test-Path $dossierAdmin) {
    Set-Location $dossierAdmin
    if (-not (Test-Path "node_modules")) {
        Info "Installation des dependances du dashboard admin (premiere fois seulement)..."
        npm install
    } elseif ((Get-Item "package.json").LastWriteTime -gt (Get-Item "node_modules").LastWriteTime) {
        Info "package.json (dashboard) plus recent que node_modules : reinstallation..."
        npm install
    }
    # Toujours regenere (pas seulement si absent) : un .env cree lors d'un
    # ancien lancement avec un autre port de gateway ne serait sinon jamais
    # mis a jour, et le dashboard continuerait a appeler le mauvais port.
    "VITE_API_BASE_URL=http://localhost:8090" | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory $dossierAdmin -WindowStyle Normal
    Succes "Dashboard admin lance dans sa propre fenetre : http://localhost:5173 (connexion : admin@myaddictive.com / AdminAddictive2026!)"
} else {
    Attention "Dossier admin-dashboard introuvable, dashboard non lance."
}
Set-Location (Join-Path $racine "mobile-app")

# Evite le bug 'spawn EPERM' rencontre sous Windows avec l'ouverture auto du navigateur.
$env:BROWSER = "none"

Succes "Tout est pret (backend + dashboard admin + app mobile). Lancement d'Expo - scanne le QR code avec l'app Expo Go sur ton telephone."
# Augmente la limite memoire par defaut de Node.js : sur une machine qui fait
# deja tourner les 10 microservices Java, le bundler Metro peut sinon planter
# avec "Fatal process out of memory" en pleine compilation (voir aussi
# metro.config.js, qui limite le nombre de workers paralleles pour la meme raison).
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npx expo start
