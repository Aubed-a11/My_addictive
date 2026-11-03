#!/usr/bin/env bash
# Pilote la pile de supervision (Prometheus, Grafana, Alertmanager, Loki, Promtail, Uptime Kuma, node-exporter, cAdvisor).
# Usage : bash devops/monitoring.sh up | down | status | logs <service> | config
# Les interfaces ne sont PAS ouvertes sur Internet : acces par tunnel SSH (voir DEVOPS.md).
set -Eeuo pipefail
APP=/opt/myaddictive
MON="$APP/monitoring"
ENVFILE="$APP/.env.production"
PROJET=myaddictive-monitoring
cmd="${1:-status}"

[ -f "$ENVFILE" ] || { echo "ERREUR : $ENVFILE introuvable"; exit 1; }

# Reseau Docker de l'application : on le lit sur le conteneur de la passerelle (son nom depend de docker-compose.yml)
trouver_reseau() {
  local gw
  gw=$(cd "$APP" && docker compose --env-file .env.production ps -q gateway-service | head -1)
  [ -n "$gw" ] || { echo "ERREUR : conteneur gateway-service introuvable (l'application est-elle demarree ?)" >&2; exit 1; }
  docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}' "$gw" | head -1
}

# Genere alertmanager.yml (mot de passe e-mail) et un mot de passe Grafana si absent
generer_config() {
  python3 - "$ENVFILE" "$MON" <<'PY'
import sys, secrets, os
envfile, mon = sys.argv[1], sys.argv[2]
env = {}
for l in open(envfile, encoding="utf-8"):
    l = l.strip()
    if l and not l.startswith("#") and "=" in l:
        k, v = l.split("=", 1); env[k.strip()] = v.strip().strip('"').strip("'")
if not env.get("GRAFANA_ADMIN_PASSWORD"):
    mdp = secrets.token_urlsafe(18)
    with open(envfile, "a", encoding="utf-8") as f: f.write(f"\nGRAFANA_ADMIN_PASSWORD={mdp}\n")
    print("Mot de passe Grafana genere et ajoute a .env.production (utilisateur : admin)")
user, pw = env.get("MAIL_USERNAME", ""), env.get("MAIL_PASSWORD", "")
dest = env.get("ALERTE_EMAIL") or user
if not (user and pw):
    print("ATTENTION : MAIL_USERNAME / MAIL_PASSWORD absents : les alertes e-mail de Prometheus ne partiront pas")
def q(x): return x.replace("'", "''")
t = open(os.path.join(mon, "alertmanager", "alertmanager.tmpl.yml"), encoding="utf-8").read()
t = t.replace("@@MAIL_USERNAME@@", q(user)).replace("@@MAIL_PASSWORD@@", q(pw)).replace("@@ALERTE_EMAIL@@", q(dest))
out = os.path.join(mon, "alertmanager", "alertmanager.yml")
open(out, "w", encoding="utf-8").write(t)
os.chmod(out, 0o644)   # lu par le conteneur ; le dossier parent reste en 700
os.chmod(os.path.join(mon, "alertmanager"), 0o700)
PY
}

compose() {
  RESEAU_APP="$(trouver_reseau)" \
  docker compose -p "$PROJET" --env-file "$ENVFILE" -f "$MON/docker-compose.monitoring.yml" "$@"
}

case "$cmd" in
  up)
    generer_config
    compose up -d
    echo
    echo "Supervision demarree. Acces par tunnel SSH depuis votre PC :"
    echo "  ssh -L 3000:localhost:3000 -L 3001:localhost:3001 -L 9090:localhost:9090 -L 9093:localhost:9093 root@76.13.37.17"
    echo "  Grafana http://localhost:3000 (admin / mot de passe : GRAFANA_ADMIN_PASSWORD dans .env.production)"
    echo "  Uptime Kuma http://localhost:3001 (creer le compte au premier acces)"
    echo "  Prometheus http://localhost:9090 · Alertmanager http://localhost:9093"
    ;;
  down)   compose down ;;
  status) compose ps ;;
  logs)   compose logs --tail=100 "${2:-prometheus}" ;;
  config) compose config >/dev/null && echo "Configuration valide." ;;
  *) echo "Usage : $0 up | down | status | logs <service> | config"; exit 1 ;;
esac
