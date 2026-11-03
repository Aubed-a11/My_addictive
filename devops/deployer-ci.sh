#!/usr/bin/env bash
# Deploiement automatique (appele par GitHub Actions via SSH, ou a la main).
# Le nouveau code est dans le dossier d'ou ce script est lance (/opt/incoming).
# Usage : cd /opt/incoming && bash devops/deployer-ci.sh <sha-du-commit>
set -Eeuo pipefail
INCOMING="$(cd "$(dirname "$0")/.." && pwd)"
SHA="${1:-manuel}"
# shellcheck source=lib.sh
. "$INCOMING/devops/lib.sh"

exec 9>/var/lock/myaddictive-deploy.lock
flock -n 9 || { echo "Un deploiement est deja en cours : abandon."; exit 1; }
[ -f "$APP/.env.production" ] || { echo "ERREUR : $APP/.env.production introuvable (secrets du serveur)."; exit 1; }

log "=== Deploiement ${SHA:0:7} ==="
echec() {
  trap - ERR
  log "ECHEC du deploiement : retour automatique a la version precedente"
  python3 "$APP/devops/alerte.py" "My Addictive : deploiement ${SHA:0:7} ECHOUE" "Le deploiement a echoue, retour automatique a la version precedente. Voir les journaux de GitHub Actions." || true
  AUTO=1 bash "$APP/devops/rollback.sh" || true
  exit 1
}

trap echec ERR
log "1/8 Archive de la version actuelle";      archiver_release "$SHA"
log "2/8 Copie du nouveau code";               synchroniser_code "$INCOMING"
log "3/8 Variables docker-compose";            completer_compose
log "4/8 Compilation";                         compiler
log "5/8 Images Docker";                       construire_images
log "6/8 Base SQLite (WAL)";                   initialiser_db

log "7/8 Demarrage et healthchecks";           demarrer_et_attendre
log "8/8 Proxy et tests de fumee";             verifier_passerelle_vers_app || true; redemarrer_proxy; tests_fumee

echo "$SHA" > "$APP/.version-deployee"
python3 "$APP/devops/alerte.py" "My Addictive : deploiement ${SHA:0:7} reussi" "Tous les controles sont conformes." || true
log "=== Deploiement ${SHA:0:7} reussi ==="
