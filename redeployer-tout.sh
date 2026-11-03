#!/usr/bin/env bash
# Redeploiement complet du backend My Addictive, en une seule commande.
# Usage (sur le VPS, en root, apres avoir copie le projet dans /opt/myaddictive) :
#   cd /opt/myaddictive && bash redeployer-tout.sh [cle_privee_kkiapay_tpr_...]
set -e
cd /opt/myaddictive
ENVF="--env-file .env.production"

echo "== 1/7 Cles (email Gmail, KKiaPay)"
bash ajouter-cles-serveur.sh "${1:-}"

echo "== 2/7 Variables dans docker-compose.yml (seulement si absentes)"
grep -q 'MAIL_USERNAME' docker-compose.yml || sed -i '/ADMIN_MOT_DE_PASSE: /a\      MAIL_USERNAME: ${MAIL_USERNAME:-}\n      MAIL_PASSWORD: ${MAIL_PASSWORD:-}' docker-compose.yml
grep -q 'KKIAPAY_PUBLIC_KEY' docker-compose.yml || sed -i '/KKIAPAY_SECRET_KEY: /a\      KKIAPAY_WEBHOOK_SECRET: ${KKIAPAY_WEBHOOK_SECRET:-}\n      KKIAPAY_PUBLIC_KEY: ${KKIAPAY_PUBLIC_KEY:-}\n      KKIAPAY_PRIVATE_KEY: ${KKIAPAY_PRIVATE_KEY:-}\n      KKIAPAY_SANDBOX: ${KKIAPAY_SANDBOX:-true}\n      PAIEMENT_SIMULATION: ${PAIEMENT_SIMULATION:-false}' docker-compose.yml
grep -n "MAIL_\|KKIAPAY" docker-compose.yml

echo "== Nettoyage : fichiers de musique-service copies par erreur dans live-service"
rm -f live-service/src/main/java/bj/myaddictive/live/repository/TitreRepository.java \
      live-service/src/main/java/bj/myaddictive/live/service/MusiqueService.java \
      live-service/src/main/java/bj/myaddictive/live/controller/MusiqueController.java

echo "== 3/7 Compilation"
mvn -q -DskipTests clean package -pl compte-service,paiement-service,gateway-service,live-service,votes-service,musique-service,boutique-service,media-service

echo "== 4/7 Construction des images (une a la fois)"
for s in config-service compte-service paiement-service gateway-service live-service votes-service musique-service boutique-service media-service; do
  echo "-- build $s"
  docker compose $ENVF build "$s"
done

echo "== Initialisation de la base SQLite unique (mode WAL, avant que les 7 services ne l'ouvrent ensemble)"
docker compose $ENVF up --no-start compte-service >/dev/null 2>&1 || true
VOL_DB=$(docker volume ls --format '{{.Name}}' | grep -E '(^|_)data_db$' | head -1)
if [ -n "$VOL_DB" ]; then
  DB_DIR=$(docker volume inspect -f '{{.Mountpoint}}' "$VOL_DB")
  python3 - "$DB_DIR/myaddictive.db" <<'PY'
import sqlite3, sys
c = sqlite3.connect(sys.argv[1], timeout=30)
print("journal_mode =", c.execute("PRAGMA journal_mode=WAL").fetchone()[0])
c.close()
PY
else
  echo "[ATTENTION] volume data_db introuvable : verifie que docker-compose.override.yml est bien present dans /opt/myaddictive"
fi

echo "== 5/7 Demarrage"
docker compose $ENVF up -d

echo "== 6/7 Attente de l'inscription Eureka (5 min)"
sleep 300
docker compose $ENVF restart proxy
sleep 20

echo "== 7/7 Controles"
echo -n "Webhook generique bloque (attendu 403) : "
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://76-13-37-17.nip.io/api/paiement/webhook/1 -H "Content-Type: application/json" -d '{"statut":"REUSSI"}'
echo -n "Contournement par nom de service bloque (attendu 403 ou 404) : "
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://76-13-37-17.nip.io/paiement-service/api/paiement/webhook/1
echo -n "Endpoints internes bloques (attendu 403) : "
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://76-13-37-17.nip.io/api/interne/paiement-confirme -H "Content-Type: application/json" -d '{}'
echo -n "Titres musique (attendu 200) : "
curl -s -o /dev/null -w "%{http_code}\n" "https://76-13-37-17.nip.io/api/musique/titres?size=1"
docker compose $ENVF ps
echo "Si c'est la PREMIERE fois avec SQLite et que tu veux reprendre les anciennes donnees : bash migrer-vers-sqlite.sh"
echo "Termine. Supprime maintenant le fichier de cles :  rm /opt/myaddictive/ajouter-cles-serveur.sh"
