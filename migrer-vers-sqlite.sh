#!/usr/bin/env bash
# Reprise des donnees des anciennes bases H2 (une par service) dans la base SQLite unique.
# A lancer UNE SEULE FOIS, apres "bash redeployer-tout.sh" (qui cree la base SQLite et ses tables) :
#   cd /opt/myaddictive && bash migrer-vers-sqlite.sh
# Les anciennes bases H2 ne sont ni modifiees ni supprimees (elles restent dans leurs volumes Docker) :
# en cas de souci, on peut revenir en arriere.
set -e
cd /opt/myaddictive
ENVF="--env-file .env.production"
DC="docker compose $ENVF"
SERVICES="compte-service media-service musique-service live-service votes-service boutique-service paiement-service"
SORTIE=/opt/myaddictive/migration-h2
SAUVEGARDES=/opt/sauvegardes
mkdir -p "$SORTIE" "$SAUVEGARDES"
rm -f "$SORTIE"/*.csv "$SORTIE"/*.sql

echo "== 1/6 Verification : les services doivent avoir cree la base SQLite"
VOL_DB=$(docker volume ls --format '{{.Name}}' | grep -E '(^|_)data_db$' | head -1)
[ -n "$VOL_DB" ] || { echo "[ERREUR] volume data_db introuvable : lance d'abord 'bash redeployer-tout.sh'"; exit 1; }
DB_DIR=$(docker volume inspect -f '{{.Mountpoint}}' "$VOL_DB")
DB="$DB_DIR/myaddictive.db"
[ -f "$DB" ] || { echo "[ERREUR] $DB absent : lance d'abord 'bash redeployer-tout.sh' et attends 3 minutes"; exit 1; }
echo "Base SQLite : $DB"

echo "== 2/6 Outil H2 (pour lire les anciennes bases)"
H2JAR=$(find /root/.m2 -name 'h2-2*.jar' 2>/dev/null | sort | tail -1)
if [ -z "$H2JAR" ]; then
  mvn -q dependency:get -Dartifact=com.h2database:h2:2.2.224 >/dev/null
  H2JAR=$(find /root/.m2 -name 'h2-2*.jar' 2>/dev/null | sort | tail -1)
fi
[ -n "$H2JAR" ] || { echo "[ERREUR] h2.jar introuvable"; exit 1; }
cp "$H2JAR" "$SORTIE/h2.jar"
echo "h2 : $H2JAR"

echo "== 3/6 Sauvegarde de securite (anciennes bases + nouvelle base)"
HORO=$(date +%Y%m%d-%H%M%S)
for s in compte media musique live votes boutique paiement; do
  V=$(docker volume ls --format '{{.Name}}' | grep -E "(^|_)data_${s}\$" | head -1)
  [ -n "$V" ] && docker run --rm -v "$V":/data -v "$SAUVEGARDES":/sauv alpine tar czf "/sauv/h2-$s-$HORO.tgz" -C /data . || true
done
docker run --rm -v "$VOL_DB":/data -v "$SAUVEGARDES":/sauv alpine tar czf "/sauv/sqlite-avant-migration-$HORO.tgz" -C /data .
echo "Sauvegardes dans $SAUVEGARDES"

echo "== 4/6 Arret des services (le temps de la reprise)"
$DC stop $SERVICES

echo "== 5/6 Export des anciennes bases H2 en CSV"
for s in compte media musique live votes boutique paiement; do
  V=$(docker volume ls --format '{{.Name}}' | grep -E "(^|_)data_${s}\$" | head -1)
  if [ -z "$V" ]; then echo "  - $s : pas d'ancien volume, ignore"; continue; fi
  BASE="${s}_db"; [ "$s" = "compte" ] && BASE="compte_db_v2"
  if ! docker run --rm -v "$V":/data alpine sh -c "ls /data/${BASE}.mv.db >/dev/null 2>&1"; then
    echo "  - $s : pas de fichier ${BASE}.mv.db, ignore"; continue
  fi
  python3 migrer_h2_sqlite.py sql "$s" > "$SORTIE/$s.sql"
  docker run --rm -v "$V":/data -v "$SORTIE":/out eclipse-temurin:17-jre-alpine \
    java -cp /out/h2.jar org.h2.tools.RunScript -url "jdbc:h2:file:/data/${BASE}" -user sa -script "/out/$s.sql" -continueOnError \
    && echo "  + $s exporte" || echo "  ! $s : export partiel (voir messages ci-dessus)"
done

echo "== 6/6 Reprise dans SQLite puis redemarrage"
python3 migrer_h2_sqlite.py importer "$DB" "$SORTIE"
$DC up -d
echo "Services relances. Attends 3 a 5 minutes (inscription Eureka), puis :"
echo "  $DC restart proxy"
echo "Verification : curl -s -o /dev/null -w '%{http_code}\n' https://76-13-37-17.nip.io/api/musique/titres?size=1"
