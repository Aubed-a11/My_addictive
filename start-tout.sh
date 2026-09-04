#!/usr/bin/env bash
#
# Demarre TOUT en une seule commande, SANS DOCKER : compile les 10
# microservices avec Maven, les lance directement en Java (bases de
# donnees H2 embarquees, pas de Postgres/Redis/RabbitMQ/MinIO a installer),
# puis lance l'app mobile (Expo) avec detection automatique de l'IP locale.
#
# Usage : ./start-tout.sh
#
# Prerequis : Java 17+ (JDK), Maven, Node.js + npm, l'app Expo Go sur ton
# telephone (ou un emulateur Android/iOS).
#
set -uo pipefail
cd "$(dirname "$0")"

BLEU='\033[0;34m'; VERT='\033[0;32m'; JAUNE='\033[1;33m'; ROUGE='\033[0;31m'; RESET='\033[0m'
info()      { echo -e "${BLEU}-> $1${RESET}"; }
succes()    { echo -e "${VERT}OK  $1${RESET}"; }
attention() { echo -e "${JAUNE}!!  $1${RESET}"; }
erreur()    { echo -e "${ROUGE}X   $1${RESET}"; }

# ---------- 0. Verification des prerequis ----------
if ! command -v java &> /dev/null; then
  erreur "Java n'est pas installe ou pas dans le PATH. Installe un JDK 17+ (ex. https://adoptium.net) puis relance ce script."
  exit 1
fi
if ! command -v mvn &> /dev/null; then
  erreur "Maven n'est pas installe ou pas dans le PATH. Installe Maven (https://maven.apache.org/download.cgi) puis relance ce script."
  exit 1
fi
if ! command -v npm &> /dev/null; then
  erreur "Node.js/npm n'est pas installe. Installe Node.js (https://nodejs.org) puis relance ce script."
  exit 1
fi

# ---------- 0bis. JAVA_HOME : le detecter et le fixer pour cette session si besoin ----------
if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
  CHEMIN_JAVA=$(command -v java)
  if [ -n "$CHEMIN_JAVA" ]; then
    CHEMIN_JAVA_REEL=$(readlink -f "$CHEMIN_JAVA" 2>/dev/null || echo "$CHEMIN_JAVA")
    export JAVA_HOME="$(dirname "$(dirname "$CHEMIN_JAVA_REEL")")"
    info "JAVA_HOME auto-detecte pour cette session : $JAVA_HOME"
  else
    erreur "Impossible de detecter automatiquement l'installation de Java."
    exit 1
  fi
else
  info "JAVA_HOME deja valide : $JAVA_HOME"
fi

# ---------- 1. Variables d'environnement (.env facultatif) ----------
if [ -f .env ]; then
  info "Chargement de .env dans l'environnement du backend."
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
else
  info "Aucun .env trouve, valeurs par defaut utilisees (voir .env.example)."
fi

# ---------- 1bis. Nettoyage de fichiers obsoletes (extraction precedente) ----------
FICHIERS_OBSOLETES=(
  "musique-service/src/main/java/bj/myaddictive/musique/config/RabbitMQConsumerConfig.java"
  "musique-service/src/main/java/bj/myaddictive/musique/messaging/PaiementConfirmeListener.java"
  "musique-service/src/main/java/bj/myaddictive/musique/messaging/PaiementConfirmeEvent.java"
  "live-service/src/main/java/bj/myaddictive/live/config/RabbitMQConsumerConfig.java"
  "live-service/src/main/java/bj/myaddictive/live/messaging/PaiementConfirmeListener.java"
  "live-service/src/main/java/bj/myaddictive/live/messaging/PaiementConfirmeEvent.java"
  "votes-service/src/main/java/bj/myaddictive/votes/config/RabbitMQConsumerConfig.java"
  "votes-service/src/main/java/bj/myaddictive/votes/messaging/PaiementConfirmeListener.java"
  "votes-service/src/main/java/bj/myaddictive/votes/messaging/PaiementConfirmeEvent.java"
  "boutique-service/src/main/java/bj/myaddictive/boutique/config/RabbitMQConsumerConfig.java"
  "boutique-service/src/main/java/bj/myaddictive/boutique/messaging/PaiementConfirmeListener.java"
  "boutique-service/src/main/java/bj/myaddictive/boutique/messaging/PaiementConfirmeEvent.java"
  "paiement-service/src/main/java/bj/myaddictive/paiement/config/RabbitMQConfig.java"
  "paiement-service/src/main/java/bj/myaddictive/paiement/messaging/PaiementEventPublisher.java"
)
NETTOYES=0
for f in "${FICHIERS_OBSOLETES[@]}"; do
  if [ -f "$f" ]; then
    rm -f "$f"
    NETTOYES=$((NETTOYES+1))
  fi
done
if [ "$NETTOYES" -gt 0 ]; then
  attention "$NETTOYES ancien(s) fichier(s) RabbitMQ obsolete(s) supprime(s) (restes d'une extraction precedente)."
fi

# ---------- 2. Compilation de tous les microservices (un seul build multi-module) ----------
info "Compilation des 10 microservices avec Maven (premiere fois : peut prendre plusieurs minutes)..."
if ! mvn -q -DskipTests clean package; then
  erreur "La compilation Maven a echoue. Regarde le message d'erreur ci-dessus (souvent une erreur de compilation Java a corriger)."
  exit 1
fi
succes "Compilation terminee."

# ---------- 3. Lancement natif des services (H2 embarque, pas d'infra externe requise) ----------
mkdir -p logs
RACINE="$(pwd)"
: > .pids-backend

lancer_service() {
  local nom="$1"
  local jar
  jar=$(find "$RACINE/$nom/target" -maxdepth 1 -name "*.jar" ! -name "*sources*" | head -n1)
  if [ -z "$jar" ]; then
    erreur "Jar introuvable pour $nom (le build a-t-il reussi ?)."
    return
  fi
  local java_bin="java"
  if [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    java_bin="$JAVA_HOME/bin/java"
  fi
  ( cd "$RACINE" && nohup "$java_bin" -jar "$jar" > "logs/$nom.log" 2>&1 & echo $! >> .pids-backend )
  info "$nom demarre, logs dans logs/$nom.log"
}

info "Lancement de l'annuaire de services (Eureka)..."
lancer_service "discovery-service"
sleep 12

info "Lancement de la configuration centralisee..."
lancer_service "config-service"

# Attente active plutot qu'un delai fixe (voir version PowerShell pour le detail
# du raisonnement : le port de chaque service depend normalement de config-service).
info "Attente que la configuration centralisee soit prete..."
config_pret=0
for i in $(seq 1 20); do
  if curl -sf -o /dev/null -m 2 "http://localhost:8888/actuator/health"; then
    config_pret=1
    break
  fi
  sleep 2
done
if [ "$config_pret" -eq 0 ]; then
  attention "config-service ne repond pas encore apres 40 secondes ; on continue quand meme."
fi

info "Lancement des 7 microservices metier (compte, media, musique, live, votes, boutique, paiement)..."
for service in compte-service media-service musique-service live-service votes-service boutique-service paiement-service; do
  lancer_service "$service"
done
sleep 15

info "Lancement de la gateway..."
lancer_service "gateway-service"
sleep 10

succes "Les 10 services sont lances. Logs consultables dans le dossier logs/."

# ---------- 4. Attente que la gateway reponde ----------
info "Verification que la gateway repond (peut prendre 1 a 2 minutes le temps qu'Eureka enregistre tous les services)..."
PRET=0
for i in $(seq 1 60); do
  if curl -sf http://localhost:8090/actuator/health > /dev/null 2>&1; then PRET=1; break; fi
  sleep 5
  echo -n "."
done
echo ""
if [ "$PRET" -eq 0 ]; then
  attention "La gateway ne repond pas encore. Regarde logs/gateway-service.log et logs/discovery-service.log si l'app mobile n'arrive pas a se connecter."
else
  succes "Backend operationnel."
fi
succes "Eureka (annuaire des services) : http://localhost:8761"
succes "Pour arreter le backend : ./stop-tout.sh"

# ---------- 5. Detection de l'IP locale (pour un telephone physique en Wi-Fi) ----------
info "Detection de l'adresse IP locale de cette machine..."
IP_LOCALE=""
if command -v python3 &> /dev/null; then
  IP_LOCALE=$(python3 - << 'PYEOF'
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("8.8.8.8", 80))
    print(s.getsockname()[0])
except Exception:
    print("")
finally:
    s.close()
PYEOF
)
fi
if [ -z "$IP_LOCALE" ] && command -v ipconfig &> /dev/null; then
  IP_LOCALE=$(ipconfig getifaddr en0 2>/dev/null || true)
fi
if [ -z "$IP_LOCALE" ] && command -v hostname &> /dev/null; then
  IP_LOCALE=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
fi

if [ -z "$IP_LOCALE" ]; then
  attention "Impossible de detecter automatiquement l'IP locale. Utilisation de localhost (ne fonctionnera que sur emulateur/simulateur, pas sur un telephone physique)."
  IP_LOCALE="localhost"
else
  succes "IP locale detectee : $IP_LOCALE"
fi

# ---------- 6. Config de l'app mobile ----------
cd mobile-app
echo "API_BASE_URL=http://${IP_LOCALE}:8090" > .env
info "mobile-app/.env mis a jour avec API_BASE_URL=http://${IP_LOCALE}:8090"
attention "Sur emulateur Android, l'app utilisera automatiquement 10.0.2.2 a la place si besoin (voir README)."

if [ ! -d node_modules ]; then
  info "Installation des dependances de l'app mobile (premiere fois seulement)..."
  npm install
elif [ package.json -nt node_modules ]; then
  info "package.json plus recent que node_modules (nouvelle dependance ajoutee) : reinstallation..."
  npm install
fi

# ---------- 7. Lancement du dashboard admin (en arriere-plan) ----------
cd "$RACINE"
if [ -d admin-dashboard ]; then
  cd admin-dashboard
  if [ ! -d node_modules ]; then
    info "Installation des dependances du dashboard admin (premiere fois seulement)..."
    npm install
  elif [ package.json -nt node_modules ]; then
    info "package.json (dashboard) plus recent que node_modules : reinstallation..."
    npm install
  fi
  # Toujours regenere : un .env cree lors d'un ancien lancement avec un autre
  # port de gateway ne serait sinon jamais mis a jour.
  echo "VITE_API_BASE_URL=http://localhost:8090" > .env
  nohup npm run dev > "$RACINE/logs/admin-dashboard.log" 2>&1 &
  echo $! >> "$RACINE/.pids-backend"
  succes "Dashboard admin lance en arriere-plan : http://localhost:5173 (connexion : admin@myaddictive.com / AdminAddictive2026!)"
  cd "$RACINE/mobile-app"
else
  attention "Dossier admin-dashboard introuvable, dashboard non lance."
fi

succes "Tout est pret (backend + dashboard admin + app mobile). Lancement d'Expo - scanne le QR code avec l'app Expo Go sur ton telephone."
npx expo start
