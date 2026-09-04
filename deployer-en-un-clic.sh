#!/usr/bin/env bash
# ============================================================================
# Script de deploiement complet en une seule execution - My Addictive
# A copier sur le VPS et executer UNE SEULE FOIS pour un premier deploiement
# (relancer ensuite simplement ./deployer.sh apres chaque mise a jour du code).
#
# Mode : IP seule, sans nom de domaine (HTTP simple sur le port 80).
# Utilisateur attendu : ubuntu (avec sudo), VPS Ubuntu 22.04/24.04.
#
# Utilisation :
#   1. Uploade myaddictive-projet-complet.zip a la racine du dossier perso de
#      l'utilisateur ubuntu sur le VPS (depuis ton PC) :
#        scp -i ta_cle.pem myaddictive-projet-complet.zip ubuntu@179.237.82.19:~
#   2. Uploade ce script (deployer-en-un-clic.sh) de la meme maniere :
#        scp -i ta_cle.pem deployer-en-un-clic.sh ubuntu@179.237.82.19:~
#   3. Connecte-toi et lance-le :
#        ssh -i ta_cle.pem ubuntu@179.237.82.19
#        chmod +x deployer-en-un-clic.sh
#        ./deployer-en-un-clic.sh
# ============================================================================
set -euo pipefail

IP_VPS="${1:-179.237.82.19}"
DOSSIER_PROJET="/opt/myaddictive"
ZIP_SOURCE="$HOME/myaddictive-projet-complet.zip"

echo "=============================================="
echo " My Addictive - Deploiement sur $IP_VPS"
echo "=============================================="
echo

# ---------------------------------------------------------------------------
# 1. Verifications prealables
# ---------------------------------------------------------------------------
if [ ! -f "$ZIP_SOURCE" ]; then
  echo "ERREUR : $ZIP_SOURCE introuvable."
  echo "Uploade d'abord le zip du projet depuis ton PC avec :"
  echo "  scp -i ta_cle.pem myaddictive-projet-complet.zip ubuntu@$IP_VPS:~"
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Installation des outils systeme (idempotent : ne reinstalle pas si deja present)
# ---------------------------------------------------------------------------
echo "-> Mise a jour du systeme et installation des outils..."
export DEBIAN_FRONTEND=noninteractive
sudo -E apt update -y
sudo -E apt upgrade -y

if ! command -v docker &> /dev/null; then
  echo "-> Installation de Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
else
  echo "-> Docker deja installe, on continue."
fi

if ! command -v mvn &> /dev/null || ! command -v java &> /dev/null; then
  echo "-> Installation de JDK 17 et Maven..."
  sudo -E apt install -y openjdk-17-jdk maven git unzip rsync
else
  echo "-> JDK/Maven deja installes, on continue."
  sudo -E apt install -y rsync unzip
fi

# ---------------------------------------------------------------------------
# 3. Recuperation du projet
# ---------------------------------------------------------------------------
echo "-> Preparation du dossier $DOSSIER_PROJET..."
sudo mkdir -p "$DOSSIER_PROJET"
sudo chown "$USER":"$USER" "$DOSSIER_PROJET"

if [ -d "$DOSSIER_PROJET/mobile-app" ]; then
  echo "-> Un projet existe deja dans $DOSSIER_PROJET : sauvegarde de l'ancien .env.production si present..."
  if [ -f "$DOSSIER_PROJET/.env.production" ]; then
    cp "$DOSSIER_PROJET/.env.production" /tmp/.env.production.sauvegarde
  fi
fi

echo "-> Extraction du projet..."
rm -rf /tmp/extraction-myaddictive
mkdir -p /tmp/extraction-myaddictive
unzip -q "$ZIP_SOURCE" -d /tmp/extraction-myaddictive
rsync -a --delete --exclude='.env.production' /tmp/extraction-myaddictive/myaddictive/ "$DOSSIER_PROJET/"
rm -rf /tmp/extraction-myaddictive
cd "$DOSSIER_PROJET"

# Restaure un .env.production existant plutot que d'en regenerer un nouveau
# (evite de changer le JWT_SECRET et de deconnecter tout le monde a chaque redeploiement).
if [ -f /tmp/.env.production.sauvegarde ]; then
  mv /tmp/.env.production.sauvegarde "$DOSSIER_PROJET/.env.production"
  echo "-> .env.production restaure depuis le deploiement precedent."
fi

# ---------------------------------------------------------------------------
# 4. Generation de .env.production (uniquement si absent : premier deploiement)
# ---------------------------------------------------------------------------
if [ ! -f "$DOSSIER_PROJET/.env.production" ]; then
  echo "-> Premier deploiement : generation de .env.production avec des secrets uniques..."
  JWT_SECRET_GENERE=$(openssl rand -base64 48)
  MDP_ADMIN_GENERE=$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)

  cat > "$DOSSIER_PROJET/.env.production" << EOF
DOMAINE=$IP_VPS
URL_PUBLIQUE_API=http://$IP_VPS/api
JWT_SECRET=$JWT_SECRET_GENERE
ADMIN_EMAIL=admin@myaddictive.com
ADMIN_MOT_DE_PASSE=$MDP_ADMIN_GENERE

# Paiement : laisser vide pour rester en mode simulation (voir DEPLOIEMENT.md
# section "3bis" pour activer les vrais paiements MTN Mobile Money).
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
MTN_MOMO_TARGET_ENVIRONMENT=sandbox
MTN_MOMO_CALLBACK_HOST=
MOOV_MONEY_API_KEY=
EOF

  echo
  echo "!! NOTE BIEN CES IDENTIFIANTS (affiches une seule fois) !!"
  echo "   Email admin      : admin@myaddictive.com"
  echo "   Mot de passe admin : $MDP_ADMIN_GENERE"
  echo
else
  echo "-> .env.production existant conserve tel quel (pas de premier deploiement)."
fi

# ---------------------------------------------------------------------------
# 5. Pare-feu (ouvre le port 80, et 22 pour ne pas se couper l'acces SSH)
# ---------------------------------------------------------------------------
if command -v ufw &> /dev/null; then
  echo "-> Configuration du pare-feu (ports 22 et 80)..."
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw --force enable
fi

# ---------------------------------------------------------------------------
# 6. Compilation + lancement (deployer.sh)
# ---------------------------------------------------------------------------
echo "-> Lancement du deploiement (compilation Maven + Docker Compose)..."
chmod +x deployer.sh
# sg (plutot que newgrp) execute une seule commande sous le groupe "docker" sans
# ouvrir un nouveau shell interactif : plus fiable dans un script non-interactif,
# et necessaire seulement si Docker vient d'etre installe a l'instant (nouveau
# groupe pas encore actif dans cette session). Si l'utilisateur etait deja dans
# le groupe docker au prealable, ceci fonctionne aussi bien.
sg docker -c "./deployer.sh"

echo
echo "=============================================="
echo " Deploiement termine !"
echo " Dashboard admin : http://$IP_VPS"
echo " API             : http://$IP_VPS/api"
echo " App mobile      : mets EXPO_PUBLIC_API_BASE_URL=http://$IP_VPS/api"
echo "                   dans mobile-app/.env (ou sur Vercel)"
echo "=============================================="
