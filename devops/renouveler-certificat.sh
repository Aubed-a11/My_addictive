#!/usr/bin/env bash
# Renouvellement Let's Encrypt avec le certbot et le nginx du SERVEUR (partages avec les autres sites).
# Certbot ne renouvelle que ce qui expire dans moins de 30 jours ; nginx est recharge en douceur.
APP="${APP:-/opt/myaddictive}"
if certbot renew --quiet --deploy-hook "systemctl reload nginx"; then
  echo "Renouvellement verifie (certbot renew)."
else
  python3 "$APP/devops/alerte.py" "My Addictive : ECHEC du renouvellement du certificat" "certbot renew a echoue sur le serveur : lancer certbot renew --dry-run pour voir l'erreur." 2>/dev/null || true
  exit 1
fi
