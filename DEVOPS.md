# DevOps de My Addictive (v12)

Tout le cycle est dans le projet : code, integration continue, deploiement, verification, surveillance,
sauvegardes, certificat, retour arriere.

## Ce qui tourne automatiquement
| Quand | Quoi | Fichier |
|---|---|---|
| A chaque push / pull request | CI : secrets, compilation + tests, build des 2 fronts, build des images Docker | `.github/workflows/ci.yml` |
| Apres une CI verte sur `main` | Deploiement VPS, healthchecks, tests de fumee, retour auto si echec | `.github/workflows/deploy.yml` + `devops/deployer-ci.sh` |
| Toutes les 15 min | Surveillance externe du site et du certificat (e-mail GitHub si echec) | `.github/workflows/surveillance.yml` |
| Toutes les 5 min (VPS) | Conteneurs, disque, site, certificat ; e-mail si l'etat change | `devops/surveiller.sh` |
| Chaque nuit 2h30 (VPS) | Sauvegarde a chaud de la base SQLite, 14 jours gardes | `devops/sauvegarder-db.sh` |
| Chaque nuit 3h (VPS) | Renouvellement Let's Encrypt, proxy redemarre seulement si renouvele | `devops/renouveler-certificat.sh` |
| Chaque semaine | Propositions de mises a jour de dependances | `.github/dependabot.yml` |
| En continu (VPS) | Metriques, alertes, journaux, disponibilite : Prometheus, Alertmanager, Grafana, Loki, Uptime Kuma | `monitoring/` + `devops/monitoring.sh` |
| En continu (navigateur) | Erreurs des deux fronts envoyees a Sentry | `src/sentryConfig.js` des deux fronts |
| A chaque push (Vercel) | Build et mise en ligne de l'app web | `mobile-app/vercel.json` |

## Mise en place (une seule fois)
1. **VPS** : envoyer et decompresser le zip v12 dans `/opt/myaddictive`, puis :
   `cd /opt/myaddictive && bash devops/installer-exploitation.sh`
   (cree les dossiers, les taches planifiees, la rotation des journaux, fait une premiere sauvegarde et un test du certificat).
2. **Deploiement v11/SQLite a la main une premiere fois** : `bash redeployer-tout.sh` puis `bash migrer-vers-sqlite.sh`.
3. **Cle SSH de deploiement** (sur le VPS) :
   `ssh-keygen -t ed25519 -f /root/.ssh/github_deploy -N "" && cat /root/.ssh/github_deploy.pub >> /root/.ssh/authorized_keys`
   puis afficher la cle privee : `cat /root/.ssh/github_deploy`.
4. **GitHub > Settings > Secrets and variables > Actions** :
   - Secrets : `VPS_HOST` (76.13.37.17), `VPS_USER` (root), `VPS_SSH_KEY` (la cle privee complete), optionnel `VPS_PORT`.
   - Variable : `DEPLOY_AUTO` = `true` (a mettre seulement une fois l'etape 2 terminee), optionnel `PUBLIC_URL`.
5. **Alertes e-mail** : elles utilisent `MAIL_USERNAME` / `MAIL_PASSWORD` de `.env.production`.
   Pour un autre destinataire, ajouter `ALERTE_EMAIL=adresse` dans `.env.production`.

## Supervision (Prometheus, Grafana, Loki, Alertmanager, Uptime Kuma, Sentry)
Demarrage sur le VPS (apres le deploiement de l'application) : `bash devops/monitoring.sh up`
- **Prometheus** lit toutes les 15 s `/actuator/prometheus` des 7 services et de la passerelle, plus le serveur (node-exporter) et les conteneurs (cAdvisor).
- **Alertmanager** envoie un e-mail (meme compte Gmail que le reste) : service injoignable 2 min, erreurs 5xx, memoire Java > 90 %, disque > 85 %, memoire serveur > 90 %.
- **Grafana** : tableau de bord « My Addictive : vue d'ensemble » deja installe (services en ligne, erreurs, disque, memoire, requetes, temps de reponse, journaux d'erreurs).
- **Loki + Promtail** : journaux de tous les conteneurs, 14 jours, consultables dans Grafana (Explore > Loki).
- **Uptime Kuma** : a configurer une fois dans l'interface : ajouter 3 sondes HTTP (`https://76-13-37-17.nip.io/`, `.../api/musique/titres?size=1`, certificat HTTPS) et un canal de notification (e-mail ou Telegram).
- Aucune interface n'est ouverte sur Internet. Acces par tunnel SSH :
  `ssh -L 3000:localhost:3000 -L 3001:localhost:3001 -L 9090:localhost:9090 -L 9093:localhost:9093 root@76.13.37.17`
  puis Grafana sur http://localhost:3000 (utilisateur `admin`, mot de passe `GRAFANA_ADMIN_PASSWORD` genere dans `.env.production`).
- Memoire : environ 1,2 Go pour toute la pile. Si le VPS est juste, retirer `cadvisor` et `uptime-kuma` de `monitoring/docker-compose.monitoring.yml`.
- **Sentry** (erreurs des navigateurs) : creer un compte gratuit sur sentry.io, 2 projets (React et Browser JavaScript), puis coller chaque DSN dans `admin-dashboard/src/sentryConfig.js` et `mobile-app/src/utils/sentryConfig.js` (un DSN n'est pas un secret), ou definir `EXPO_PUBLIC_SENTRY_DSN` dans Vercel. Sans DSN, rien n'est envoye.

## Au quotidien
`git push` sur `main` : la CI tourne, puis le deploiement se fait seul. Resultat dans l'onglet Actions de GitHub.
Le deploiement a la main reste possible : `bash redeployer-tout.sh`.

## Si quelque chose va mal
- Deploiement echoue : retour automatique + e-mail. A la main : `bash devops/rollback.sh`.
- Base abimee : `ls /opt/sauvegardes/db` puis `bash devops/restaurer-db.sh /opt/sauvegardes/db/<fichier>.db.gz`.
- Etat : `docker compose --env-file .env.production ps` (colonne health), journaux : `/var/log/myaddictive/`.
- Certificat : `bash devops/renouveler-certificat.sh --test` (essai sans risque).

## Limites connues
- La supervision (metriques, journaux, Sentry) n'a jamais tourne sur votre serveur : a demarrer et verifier une premiere fois.
- Les tests unitaires ne couvrent que la recherche musique pour l'instant (a etendre).
- `docker-compose.yml` et `deploiement/` du serveur ne sont jamais ecrases par le deploiement automatique.
- Le retour arriere reconstruit l'ancienne version (quelques minutes) ; la base n'est jamais touchee.
- Rien de tout cela n'a ete execute sur votre VPS avant livraison : premiere mise en place a surveiller.
