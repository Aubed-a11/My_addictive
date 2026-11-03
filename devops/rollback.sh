#!/usr/bin/env bash
# Retour a la version precedente (code + images reconstruites). N'efface JAMAIS la base de donnees.
# Usage : bash devops/rollback.sh                  -> derniere archive
#         bash devops/rollback.sh /opt/sauvegardes/releases/release-....tar.gz
set -Eeuo pipefail
. /opt/myaddictive/devops/lib.sh
ARCHIVE="${1:-$(ls -1t "$SAUV"/releases/release-*.tar.gz 2>/dev/null | head -1)}"
[ -n "$ARCHIVE" ] && [ -f "$ARCHIVE" ] || { echo "Aucune archive de version trouvee dans $SAUV/releases"; exit 1; }
log "=== Retour arriere vers : $ARCHIVE ==="
tar -xzf "$ARCHIVE" -C "$APP"
chmod +x "$APP"/devops/*.sh 2>/dev/null || true
completer_compose
compiler
construire_images
initialiser_db
demarrer_et_attendre
redemarrer_proxy
if [ "${AUTO:-0}" = 1 ]; then BASE_URL="$BASE_URL" RETRIES=8 DELAY=15 bash "$APP/devops/tests-fumee.sh" || true
else tests_fumee; fi
log "=== Retour arriere termine ==="
