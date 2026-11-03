#!/usr/bin/env bash
# Renouvellement Let's Encrypt (certbot dans Docker, methode webroot : voir DEPLOIEMENT.md, section 7).
# Certbot ne renouvelle que si l'expiration est a moins de 30 jours. Le proxy n'est redemarre que si le
# certificat a change. Planifie chaque nuit. Test sans risque : bash devops/renouveler-certificat.sh --test
set -Eeuo pipefail
APP=/opt/myaddictive
CONF="$APP/deploiement/certbot/conf"; WWW="$APP/deploiement/certbot/www"
EMPREINTE() { cat "$CONF"/live/*/fullchain.pem 2>/dev/null | sha256sum | cut -d' ' -f1; }
AVANT=$(EMPREINTE)
OPT=""; [ "${1:-}" = "--test" ] && OPT="--dry-run"
if docker run --rm -v "$CONF":/etc/letsencrypt -v "$WWW":/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot $OPT; then
  APRES=$(EMPREINTE)
  if [ -z "$OPT" ] && [ "$AVANT" != "$APRES" ]; then
    cd "$APP"; docker compose --env-file .env.production restart proxy
    python3 "$APP/devops/alerte.py" "My Addictive : certificat HTTPS renouvele" "Le certificat a ete renouvele et le proxy redemarre."
    echo "Certificat renouvele, proxy redemarre."
  else echo "Rien a renouveler (ou test)."; fi
else
  python3 "$APP/devops/alerte.py" "My Addictive : ECHEC du renouvellement du certificat" "certbot renew a echoue : verifier DEPLOIEMENT.md section 5-7."
  exit 1
fi
