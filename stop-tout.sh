#!/usr/bin/env bash
# Arrete proprement les 10 processus Java du backend lances par start-tout.sh
# (l'app mobile/Expo s'arrete avec Ctrl+C dans son propre terminal).
set -uo pipefail
cd "$(dirname "$0")"

if [ ! -f .pids-backend ]; then
  echo "Aucun fichier .pids-backend trouve : le backend n'a peut-etre pas ete demarre avec start-tout.sh, ou a deja ete arrete."
  exit 0
fi

while read -r pid; do
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null && echo "OK  processus $pid arrete"
  fi
done < .pids-backend

rm -f .pids-backend
echo "Backend arrete. (Les bases H2 dans ./data/ sont conservees.)"
