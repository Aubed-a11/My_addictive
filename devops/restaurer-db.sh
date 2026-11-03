#!/usr/bin/env bash
# Restaure une sauvegarde de la base. L'ancienne base est gardee a cote (.avant-restauration).
# Usage : bash devops/restaurer-db.sh /opt/sauvegardes/db/myaddictive-AAAAMMJJ-HHMMSS.db.gz
set -Eeuo pipefail
. /opt/myaddictive/devops/lib.sh
F="${1:-}"; [ -f "$F" ] || { echo "Usage : $0 <fichier .db.gz>"; ls -1t "$SAUV"/db 2>/dev/null | head; exit 1; }
cd "$APP"
VOL=$(docker volume ls --format '{{.Name}}' | grep -E '(^|_)data_db$' | head -1)
DIR=$(docker volume inspect -f '{{.Mountpoint}}' "$VOL")
log "Arret des 7 services a base de donnees"
docker compose $ENVF stop $SERVICES_DB
[ -f "$DIR/myaddictive.db" ] && cp -a "$DIR/myaddictive.db" "$DIR/myaddictive.db.avant-restauration"
rm -f "$DIR/myaddictive.db-wal" "$DIR/myaddictive.db-shm"
gunzip -c "$F" > "$DIR/myaddictive.db"
log "Redemarrage"
docker compose $ENVF up -d $SERVICES_DB
redemarrer_proxy
log "Base restauree depuis $F"
