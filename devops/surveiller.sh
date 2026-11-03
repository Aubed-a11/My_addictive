#!/usr/bin/env bash
# Surveillance locale, lancee toutes les 5 minutes par cron.
# Verifie : conteneurs (running/healthy), disque, site public, certificat HTTPS.
# Envoie un e-mail seulement quand l'etat CHANGE (panne puis retablissement) : pas de spam.
BASE_URL="${BASE_URL:-https://76-13-37-17.nip.io}"
ETAT=/var/lib/myaddictive/etat; mkdir -p "$(dirname "$ETAT")"
PB=""

# 1) conteneurs
while IFS='|' read -r nom statut; do
  case "$statut" in
    *unhealthy*|Exited*|Restarting*|Dead*|Created*) PB="$PB\n- conteneur $nom : $statut";;
  esac
done < <(docker ps -a --filter label=com.docker.compose.project --format '{{.Names}}|{{.Status}}')

# 2) disque
USE=$(df --output=pcent / | tail -1 | tr -dc '0-9')
[ "${USE:-0}" -ge 85 ] && PB="$PB\n- disque plein a ${USE}%"

# 3) site public
c=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$BASE_URL/api/musique/titres?size=1" || echo 000)
[ "$c" = 200 ] || PB="$PB\n- API musique : code $c (attendu 200)"
c=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$BASE_URL/" || echo 000)
[ "$c" = 200 ] || PB="$PB\n- dashboard admin : code $c (attendu 200)"

# 4) certificat
HOTE=${BASE_URL#https://}; HOTE=${HOTE%%/*}
FIN=$(echo | openssl s_client -servername "$HOTE" -connect "$HOTE:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$FIN" ]; then
  J=$(( ( $(date -d "$FIN" +%s) - $(date +%s) ) / 86400 ))
  [ "$J" -lt 14 ] && PB="$PB\n- certificat HTTPS expire dans $J jours"
fi

AVANT=$(cat "$ETAT" 2>/dev/null || echo OK)
if [ -n "$PB" ]; then
  echo "$(date '+%F %T') KO$(echo -e "$PB" | tr '\n' ' ')"
  if [ "$AVANT" != KO ]; then
    echo KO > "$ETAT"
    python3 /opt/myaddictive/devops/alerte.py "My Addictive : PROBLEME detecte" "$(echo -e "Problemes detectes :$PB")"
  fi
else
  echo "$(date '+%F %T') OK"
  if [ "$AVANT" = KO ]; then
    echo OK > "$ETAT"
    python3 /opt/myaddictive/devops/alerte.py "My Addictive : retour a la normale" "Tous les controles sont de nouveau conformes."
  fi
fi
