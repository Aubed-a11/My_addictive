#!/usr/bin/env bash
# Sauvegarde a chaud de la base SQLite unique (API de sauvegarde SQLite : coherente meme en mode WAL).
# Planifie chaque nuit par installer-exploitation.sh. Garde 14 jours.
set -Eeuo pipefail
DEST=/opt/sauvegardes/db
mkdir -p "$DEST"
VOL=$(docker volume ls --format '{{.Name}}' | grep -E '(^|_)data_db$' | head -1)
[ -n "$VOL" ] || { echo "Volume data_db introuvable"; exit 1; }
SRC="$(docker volume inspect -f '{{.Mountpoint}}' "$VOL")/myaddictive.db"
[ -f "$SRC" ] || { echo "Base introuvable : $SRC"; exit 1; }
OUT="$DEST/myaddictive-$(date +%Y%m%d-%H%M%S).db"
python3 - "$SRC" "$OUT" <<'PY'
import sqlite3, sys
src = sqlite3.connect(sys.argv[1], timeout=60)
dst = sqlite3.connect(sys.argv[2])
src.backup(dst)
src.close()
res = dst.execute("PRAGMA integrity_check").fetchone()[0]
dst.close()
if res != "ok":
    print("ECHEC integrite :", res); sys.exit(2)
print("copie coherente, integrity_check = ok")
PY
gzip -f "$OUT"; chmod 600 "$OUT.gz"
find "$DEST" -name 'myaddictive-*.db.gz' -mtime +14 -delete
echo "Sauvegarde OK : $OUT.gz ($(du -h "$OUT.gz" | cut -f1))"
