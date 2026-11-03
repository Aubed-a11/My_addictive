#!/usr/bin/env bash
# Tests de fumee apres deploiement : verifie que le site repond ET que les protections tiennent.
# Usage : BASE_URL=https://76-13-37-17.nip.io RETRIES=1 DELAY=10 bash devops/tests-fumee.sh
# Code de sortie : 0 = tout est conforme, 1 = au moins un controle echoue.
BASE_URL="${BASE_URL:-https://76-13-37-17.nip.io}"
RETRIES="${RETRIES:-1}"
DELAY="${DELAY:-10}"

code() { curl -s -o /dev/null -m 20 -w "%{http_code}" "$@" || echo 000; }

un_passage() {
  local ko=0 c
  c=$(code "$BASE_URL/api/musique/titres?size=1");                                             [ "$c" = 200 ] && echo "OK   titres musique : 200" || { echo "FAIL titres musique : $c (attendu 200)"; ko=1; }
  c=$(code "$BASE_URL/");                                                                       [ "$c" = 200 ] && echo "OK   dashboard admin : 200" || { echo "FAIL dashboard admin : $c (attendu 200)"; ko=1; }
  c=$(code -X POST "$BASE_URL/api/paiement/webhook/1" -H "Content-Type: application/json" -d '{"statut":"REUSSI"}')
  [ "$c" = 403 ] && echo "OK   webhook generique bloque : 403" || { echo "FAIL webhook generique : $c (attendu 403)"; ko=1; }
  c=$(code -X POST "$BASE_URL/paiement-service/api/paiement/webhook/1")
  { [ "$c" = 403 ] || [ "$c" = 404 ]; } && echo "OK   contournement par nom de service bloque : $c" || { echo "FAIL contournement : $c (attendu 403/404)"; ko=1; }
  c=$(code -X POST "$BASE_URL/api/interne/musique/paiement-confirme" -H "Content-Type: application/json" -d '{}')
  [ "$c" = 403 ] && echo "OK   endpoints internes bloques : 403" || { echo "FAIL endpoints internes : $c (attendu 403)"; ko=1; }
  return $ko
}

i=1
while true; do
  echo "--- passage $i/$RETRIES"
  if un_passage; then echo "TESTS DE FUMEE : OK"; exit 0; fi
  [ "$i" -ge "$RETRIES" ] && { echo "TESTS DE FUMEE : ECHEC"; exit 1; }
  i=$((i+1)); sleep "$DELAY"
done
