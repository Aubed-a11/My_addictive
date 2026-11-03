#!/usr/bin/env bash
# MISE EN LIGNE DU BACKEND EN UNE COMMANDE (sur le VPS, en root).
#   1) deposer et decompresser l'archive dans /opt/incoming
#   2) cd /opt/incoming && bash devops/mise-en-ligne.sh
# Fait : verifications, copie vers /opt/myaddictive, compilation, images, base SQLite,
# demarrage, attente des healthchecks, tests de fumee, retour automatique en cas d'echec,
# puis installation des sauvegardes / surveillance (premiere fois seulement).
set -Eeuo pipefail
INCOMING="$(cd "$(dirname "$0")/.." && pwd)"
APP=/opt/myaddictive
[ "$(id -u)" = 0 ] || { echo "A lancer en root."; exit 1; }
for c in docker mvn python3 flock tar; do command -v "$c" >/dev/null || { echo "[ERREUR] '$c' est absent du serveur."; exit 1; }; done
docker compose version >/dev/null 2>&1 || { echo "[ERREUR] 'docker compose' est absent."; exit 1; }
[ -f "$APP/docker-compose.yml" ] || { echo "[ERREUR] $APP/docker-compose.yml introuvable (il vit seulement sur le serveur)."; exit 1; }
[ -f "$APP/.env.production" ]    || { echo "[ERREUR] $APP/.env.production introuvable : lance d'abord  bash ajouter-cles-serveur.sh  dans $APP."; exit 1; }
for k in MAIL_USERNAME MAIL_PASSWORD KKIAPAY_SECRET_KEY; do
  grep -q "^$k=." "$APP/.env.production" || echo "[ATTENTION] $k est vide dans .env.production (la fonction concernee sera inactive)."
done
free -m | awk '/Mem:/ {if ($7<1500) print "[ATTENTION] memoire disponible faible ("$7" Mo) : la compilation peut echouer."}'
df -m /opt | awk 'NR==2 && $4<3000 {print "[ATTENTION] moins de 3 Go libres sur /opt."}'

# Volumes de donnees attendus par l'application (crees par l'ancien deploiement)
VOLUMES_EXISTANTS=$(docker volume ls --format '{{.Name}}')
for v in data_db data_compte; do
  grep -qE "(^|_)${v}\$" <<<"$VOLUMES_EXISTANTS" || echo "[ATTENTION] volume Docker '$v' introuvable : il sera cree VIDE (photos de profil / fichiers medias deja envoyes absents)."
done

[ -d "$APP/media-service/uploads" ] || echo "[ATTENTION] $APP/media-service/uploads introuvable : les fichiers medias (pochettes, titres) seront absents."
chmod +x "$INCOMING"/devops/*.sh
bash "$INCOMING/devops/deployer-ci.sh" "mise-en-ligne-$(date +%Y%m%d%H%M)"

if [ ! -f /etc/cron.d/myaddictive ]; then
  echo "== Premiere mise en ligne : installation des sauvegardes et de la surveillance"
  bash "$APP/devops/installer-exploitation.sh"
fi
echo
echo "TERMINE. Etat :"; cd "$APP" && docker compose --env-file .env.production ps
echo "Si c'est la premiere fois avec SQLite et que vous voulez les anciennes donnees : bash $APP/migrer-vers-sqlite.sh"
echo "Supervision (optionnelle) : bash $APP/devops/monitoring.sh up"
