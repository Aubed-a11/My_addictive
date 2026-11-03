#!/usr/bin/env bash
# Redeploiement complet du backend My Addictive (ancien script, conserve pour compatibilite).
# Il passe maintenant par devops/mise-en-ligne.sh (verifications, compilation, images, base,
# demarrage, controles et retour arriere automatique).
# Usage (sur le VPS, en root) :  cd /opt/myaddictive && bash redeployer-tout.sh [cle_privee_kkiapay_tpr_...]
set -e
cd /opt/myaddictive
[ -f ajouter-cles-serveur.sh ] && bash ajouter-cles-serveur.sh "${1:-}" || echo "(ajouter-cles-serveur.sh absent : .env.production deja en place ?)"
bash devops/mise-en-ligne.sh
