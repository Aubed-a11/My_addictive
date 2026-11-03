#!/usr/bin/env bash
# Fonctions communes aux scripts DevOps de My Addictive (deployer-ci.sh, rollback.sh).
# Ce fichier est "source" (jamais execute seul).

APP=/opt/myaddictive
SAUV=/opt/sauvegardes
ENVF="--env-file .env.production"
BASE_URL="${BASE_URL:-https://76-13-37-17.nip.io}"
# Services qui ont une base SQLite (volume data_db)
SERVICES_DB="compte-service media-service musique-service live-service votes-service boutique-service paiement-service"

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
}

# 4) Compilation Maven de tous les modules
compiler() {
  cd "$APP"
  log "Compilation Maven (tests deja passes par la CI)"
  mvn -B -ntp -q -DskipTests clean package
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
  docker compose $ENVF up --no-start compte-service >/dev/null 2>&1 || true
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
  return 1
}

# 8) Le proxy garde en cache l'adresse de la passerelle : on le redemarre apres chaque deploiement
redemarrer_proxy() { cd "$APP"; docker compose $ENVF restart proxy; sleep 15; }

# 9) Tests de fumee (6 minutes de patience : inscription Eureka)
tests_fumee() {
  RETRIES=24 DELAY=15 BASE_URL="$BASE_URL" bash "$APP/devops/tests-fumee.sh"
}
