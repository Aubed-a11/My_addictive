#!/usr/bin/env bash
# Fonctions communes aux scripts DevOps de My Addictive (deployer-ci.sh, rollback.sh).
# Ce fichier est "source" (jamais execute seul).

APP=/opt/myaddictive
SAUV=/opt/sauvegardes
ENVF="--env-file .env.production"
BASE_URL="${BASE_URL:-https://76-13-37-17.nip.io}"
# Services qui ont une base SQLite (volume data_db)
SERVICES_DB="app-service"
# Anciens microservices (remplaces par app-service, desactives par le profil "ancien")
ANCIENS_SERVICES="compte-service media-service musique-service live-service votes-service boutique-service paiement-service"

log() { echo "[$(date +%H:%M:%S)] $*"; }

# 1) Archive du code actuellement en ligne (pour pouvoir revenir en arriere)
archiver_release() {
  local sha="${1:-inconnu}"
  mkdir -p "$SAUV/releases"
  [ -d "$APP" ] || return 0
  local f="$SAUV/releases/release-$(date +%Y%m%d-%H%M%S)-avant-${sha:0:7}.tar.gz"
  # Sans les secrets (.env.production), les certificats, les builds et le frontend (heberge sur Vercel)
  tar -czf "$f" -C "$APP" \
      --exclude=./.env.production --exclude=./deploiement/certbot --exclude='./*/target' \
      --exclude='./*/node_modules' --exclude=./mobile-app --exclude=./data --exclude=./logs . 2>/dev/null || true
  chmod 600 "$f"
  log "Archive de la version actuelle : $f"
  # on garde les 5 dernieres
  ls -1t "$SAUV"/releases/release-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
}

# 2) Copie du nouveau code par-dessus l'ancien (sans jamais toucher aux secrets ni aux certificats)
synchroniser_code() {
  local src="$1"
  mkdir -p "$APP"
  tar -C "$src" -cf - . | tar -C "$APP" -xf -
  # Nettoyage d'anciens fichiers copies par erreur (historique du projet)
  rm -f "$APP"/live-service/src/main/java/bj/myaddictive/live/repository/TitreRepository.java \
        "$APP"/live-service/src/main/java/bj/myaddictive/live/service/MusiqueService.java \
        "$APP"/live-service/src/main/java/bj/myaddictive/live/controller/MusiqueController.java
  chmod +x "$APP"/devops/*.sh 2>/dev/null || true
}

# 3) Variables e-mail / KKiaPay dans docker-compose.yml (idempotent)
completer_compose() {
  cd "$APP"
  [ -f docker-compose.yml ] || { log "ERREUR : docker-compose.yml introuvable dans $APP"; return 1; }
  grep -q 'MAIL_USERNAME' docker-compose.yml || sed -i '/ADMIN_MOT_DE_PASSE: /a\      MAIL_USERNAME: ${MAIL_USERNAME:-}\n      MAIL_PASSWORD: ${MAIL_PASSWORD:-}' docker-compose.yml
  grep -q 'KKIAPAY_PUBLIC_KEY' docker-compose.yml || sed -i '/KKIAPAY_SECRET_KEY: /a\      KKIAPAY_WEBHOOK_SECRET: ${KKIAPAY_WEBHOOK_SECRET:-}\n      KKIAPAY_PUBLIC_KEY: ${KKIAPAY_PUBLIC_KEY:-}\n      KKIAPAY_PRIVATE_KEY: ${KKIAPAY_PRIVATE_KEY:-}\n      KKIAPAY_SANDBOX: ${KKIAPAY_SANDBOX:-true}\n      PAIEMENT_SIMULATION: ${PAIEMENT_SIMULATION:-false}' docker-compose.yml
  # La configuration (compose + override) doit etre valide AVANT de toucher aux conteneurs.
  if ! docker compose $ENVF config -q 2>/tmp/compose-erreur.txt; then
    log "ERREUR : configuration docker compose invalide :"; cat /tmp/compose-erreur.txt; return 1
  fi
  # (liste dans une variable : "cmd | grep -q" peut echouer au hasard avec pipefail, a cause de SIGPIPE)
  local services; services=$(docker compose $ENVF config --services 2>/dev/null || true)
  if ! grep -qx app-service <<<"$services"; then
    log "ERREUR : le service app-service est absent de la configuration (docker-compose.override.yml manquant ?)"; return 1
  fi
}

# 4) Compilation Maven de tous les modules
compiler() {
  cd "$APP"
  log "Compilation Maven (tests deja passes par la CI)"
  # Seulement les 4 modules actuels : d'anciens dossiers (compte-service, musique-service...) restes sur le
  # serveur ne doivent jamais etre compiles. -Dmaven.test.skip ne compile pas non plus les tests (deja passes en CI).
  grep -q "<module>app-service</module>" pom.xml || { log "ERREUR : pom.xml ne contient pas le module app-service (ancienne version du pom ?)"; return 1; }
  mvn -B -ntp -q -Dmaven.test.skip=true -pl discovery-service,config-service,gateway-service,app-service -am clean package
}

# 5) Images Docker, un service a la fois (le VPS a peu de memoire)
construire_images() {
  cd "$APP"
  local s
  for s in $(docker compose $ENVF config --services); do
    log "build $s"
    docker compose $ENVF build "$s"
  done
}

# 6) Base SQLite unique en mode WAL
initialiser_db() {
  cd "$APP"
  docker compose $ENVF up --no-start app-service >/dev/null 2>&1 || true
  local vol dir
  vol=$(docker volume ls --format '{{.Name}}' | grep -E '(^|_)data_db$' | head -1)
  if [ -z "$vol" ]; then log "ATTENTION : volume data_db introuvable (docker-compose.override.yml present ?)"; return 0; fi
  dir=$(docker volume inspect -f '{{.Mountpoint}}' "$vol")
  python3 - "$dir/myaddictive.db" <<'PY'
import sqlite3, sys
c = sqlite3.connect(sys.argv[1], timeout=30)
print("journal_mode =", c.execute("PRAGMA journal_mode=WAL").fetchone()[0])
c.close()
PY
}

# 7) Demarrage puis attente que tous les conteneurs a healthcheck soient "healthy"
demarrer_et_attendre() {
  cd "$APP"
  # La configuration Docker doit etre valide (ex. un service qui dependrait d'un ancien service desactive)
  if ! docker compose $ENVF config -q 2>/tmp/compose-erreur.txt; then
    log "ERREUR : configuration docker compose invalide :"; cat /tmp/compose-erreur.txt
    log "Envoyez ce message tel quel (sans mot de passe) pour corriger docker-compose.yml"
    return 1
  fi
  # Les anciens microservices (desormais regroupes dans app-service) ne doivent plus tourner :
  # ils partageraient la meme base SQLite et gaspilleraient la memoire.
  # shellcheck disable=SC2086
  docker compose --profile ancien --profile hors-service $ENVF rm -sf $ANCIENS_SERVICES proxy >/dev/null 2>&1 || true
  docker compose $ENVF up -d --remove-orphans
  log "Attente des healthchecks (10 min maximum)"
  local fin=$((SECONDS+600)) ko id nom etat
  while [ $SECONDS -lt $fin ]; do
    ko=""
    for id in $(docker compose $ENVF ps -q); do
      etat=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id")
      case "$etat" in healthy|running) ;; *) nom=$(docker inspect -f '{{.Name}}' "$id"); ko="$ko ${nom#/}($etat)";; esac
    done
    [ -z "$ko" ] && { log "Tous les conteneurs sont prets"; return 0; }
    log "en attente :$ko"; sleep 15
  done
  log "ERREUR : conteneurs pas prets apres 10 min :$ko"
  docker compose $ENVF logs --tail=40 app-service 2>/dev/null || true
  return 1
}

# 7bis) La passerelle doit joindre l'application (meme reseau Docker) : sinon, on le dit clairement
verifier_passerelle_vers_app() {
  cd "$APP"
  if docker compose $ENVF exec -T gateway-service wget -q -O /dev/null -T 10 http://app-service:8080/actuator/health 2>/dev/null; then
    log "La passerelle joint bien app-service"
  else
    log "ATTENTION : la passerelle ne joint pas encore http://app-service:8080 (reseau Docker different ou application pas prete)"
    return 1
  fi
}

# 8) Le nginx du SERVEUR (partage avec d'autres sites) envoie le trafic vers la passerelle (127.0.0.1:8090).
# On le recharge en douceur, seulement si sa configuration est valide : aucun site n'est coupe.
redemarrer_proxy() {
  if nginx -t >/dev/null 2>&1; then systemctl reload nginx; log "nginx du serveur recharge"
  else log "ATTENTION : configuration nginx invalide, rechargement ignore (rien n'a ete coupe) :"; nginx -t 2>&1 | tail -5; fi
  sleep 5
}

# 9) Tests de fumee (6 minutes de patience : inscription Eureka)
tests_fumee() {
  RETRIES=24 DELAY=15 BASE_URL="$BASE_URL" bash "$APP/devops/tests-fumee.sh"
}
