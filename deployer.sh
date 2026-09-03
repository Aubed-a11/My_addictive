#!/usr/bin/env bash
# Construit les 10 microservices avec Maven, puis (re)construit et relance
# toute la stack Docker. A executer depuis la racine du projet, sur le VPS,
# apres avoir configure .env.production (voir DEPLOIEMENT.md).
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env.production ]; then
  echo "Erreur : .env.production introuvable. Copie .env.production.example vers .env.production et remplis-le d'abord."
  exit 1
fi

echo "-> Compilation des 10 microservices avec Maven..."
mvn -q -DskipTests clean package

echo "-> Construction et lancement des conteneurs Docker..."
docker compose --env-file .env.production up -d --build

echo "-> Etat des conteneurs :"
docker compose ps

echo
echo "OK Deploiement termine. Verifie que tous les conteneurs sont 'healthy' ou 'running' ci-dessus."
echo "Logs en direct : docker compose logs -f"
