# Deploiement sur un VPS Infomaniak

Guide complet, a suivre dans l'ordre. Compte environ 30-45 minutes la
premiere fois.

## Demarrage rapide SANS nom de domaine (juste l'adresse IP du VPS)

Si tu n'as pas encore de nom de domaine, tu peux deployer immediatement en
HTTP simple sur l'adresse IP du VPS (pas de HTTPS possible sans domaine :
Let's Encrypt exige un nom de domaine pour delivrer un certificat). C'est
tout a fait suffisant pour tester avec Expo Go. Tu pourras ajouter un
domaine et activer le HTTPS plus tard sans tout reconstruire.

Dans ce mode, saute directement les sections 4, 5 et 6 (obtention du
certificat SSL) : le fichier `deploiement/nginx-proxy-bootstrap.conf` est
deja configure par defaut dans `docker-compose.yml` pour ce cas — HTTP
simple sur le port 80, sans domaine requis. Suis les sections 0 a 3, puis
va directement a la section 8 ("Mettre a jour l'app mobile").

**Encore plus rapide** : `deployer-en-un-clic.sh`, a la racine du projet,
automatise entierement les sections 0 a 4 (installation des outils,
recuperation du projet, generation des secrets, pare-feu, compilation et
lancement) en une seule commande. Voir l'entete du fichier pour son usage
exact (upload du zip + du script via `scp`, puis une seule execution).

Ton adresse d'API sera : `http://IP_DU_VPS/api` (remplace `IP_DU_VPS` par
l'IP reelle de ton VPS, visible dans le dashboard Infomaniak).

---

## 0. Prerequis

- Un VPS Infomaniak actif (recommande : Ubuntu 22.04 ou 24.04 LTS, minimum
  4 Go de RAM pour faire tourner confortablement 10 microservices Java —
  2 Go fonctionne mais est juste).
- **Optionnel pour demarrer** (voir "Demarrage rapide sans domaine" plus
  haut) : un nom de domaine (ou sous-domaine) qui pointe vers l'IP de ce
  VPS. Chez votre registrar (ou directement dans Infomaniak si le domaine y
  est gere), cree un enregistrement DNS de type **A** vers l'IP publique du
  VPS. Verifie la propagation avec `ping votre-domaine.com` avant de
  continuer. Necessaire uniquement pour activer le HTTPS (section 4 a 6).

## 1. Connexion et installation des outils de base

```bash
ssh root@IP_DU_VPS
```

```bash
apt update && apt upgrade -y

# Docker + Docker Compose
curl -fsSL https://get.docker.com | sh

# JDK 17 + Maven (necessaires pour compiler les jars avant de construire
# les images Docker ; voir deployer.sh)
apt install -y openjdk-17-jdk maven git unzip
```

## 2. Recuperer le projet sur le VPS

Le plus simple : uploader le zip fourni (via `scp` depuis ton PC, ou en le
transferant par un autre moyen), puis :

```bash
mkdir -p /opt/myaddictive
cd /opt/myaddictive
unzip myaddictive-projet-complet.zip
mv myaddictive/* myaddictive/.* . 2>/dev/null
cd /opt/myaddictive
```

## 3. Configurer les secrets de production

```bash
cp .env.production.example .env.production
nano .env.production
```

Remplis en particulier :
- `DOMAINE` : ton nom de domaine exact (ou l'IP du VPS si tu n'as pas encore de domaine)
- `URL_PUBLIQUE_API` : `https://ton-domaine.com/api` — **ou, sans domaine,
  simplement `http://IP_DU_VPS/api`** (remplace par l'IP reelle)
- `JWT_SECRET` : genere une vraie valeur avec `openssl rand -base64 48` et
  colle le resultat. **Ne jamais garder la valeur de developpement.**
- `ADMIN_EMAIL` / `ADMIN_MOT_DE_PASSE` : les identifiants reels du compte
  administrateur en production (change le mot de passe par defaut).

**Si tu as un domaine et veux activer le HTTPS**, remplace aussi
`VOTRE_DOMAINE.com` par ton vrai domaine dans :
```bash
sed -i "s/VOTRE_DOMAINE.com/ton-domaine.com/g" deploiement/nginx-proxy.conf
```
**Sans domaine (mode IP seule)**, ignore cette etape : le fichier
`nginx-proxy-bootstrap.conf` deja utilise par defaut ne necessite aucun
remplacement, passe directement a la section 8.

## 3bis. Activer les vrais paiements MTN Mobile Money (optionnel mais recommande avant un vrai lancement)

Sans cette etape, tous les paiements (musique, billets, votes, boutique)
restent en **mode simulation** : confirmes automatiquement, pratique pour
tester mais inutilisable pour de vrais clients (sauf le paiement en agence,
qui necessite toujours une confirmation manuelle par un administrateur,
quel que soit ce reglage).

**1. Creer un compte sur le portail developpeur MTN MoMo**
- Rends-toi sur https://momodeveloper.mtn.com et inscris-toi.
- Abonne-toi au produit **Collections** (c'est celui qui permet de
  *recevoir* des paiements de tes clients).
- En mode bac a sable (sandbox), tu obtiens immediatement une cle
  d'abonnement (Subscription Key / `Ocp-Apim-Subscription-Key`) gratuite,
  utilisable pour tester sans argent reel.

**2. Passer en production pour le Benin**
- Le passage en production necessite une validation KYC de MTN Benin :
  ils demanderont ton IFU (Identifiant Fiscal Unique), une adresse
  physique et d'autres documents d'entreprise beninois.
- Une fois valide, MTN te fournit un lien vers ton "Compte Portail" ou tu
  recuperes tes vraies cles de production (differentes de celles du bac a
  sable).

**3. Generer un utilisateur API et sa cle**
```bash
# Cree un utilisateur API (remplace SUBSCRIPTION_KEY et ton-domaine.com) :
curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser \
  -H "X-Reference-Id: $(uuidgen)" \
  -H "Ocp-Apim-Subscription-Key: SUBSCRIPTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{"providerCallbackHost": "ton-domaine.com"}'

# Note bien le X-Reference-Id utilise : c'est ton API_USER.
# Genere ensuite sa cle (API_KEY) :
curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/API_USER/apikey \
  -H "Ocp-Apim-Subscription-Key: SUBSCRIPTION_KEY"
```

**4. Renseigner les variables d'environnement**

Ajoute dans `.env.production` (variables lues par `config-repo/paiement-service.yml`) :
```bash
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com   # ou l'URL de production fournie par MTN apres le go-live
MTN_MOMO_SUBSCRIPTION_KEY=...
MTN_MOMO_API_USER=...
MTN_MOMO_API_KEY=...
MTN_MOMO_TARGET_ENVIRONMENT=sandbox                        # ou "mtnbenin" en production
MTN_MOMO_CALLBACK_HOST=https://ton-domaine.com             # doit etre en HTTPS valide pour que MTN puisse rappeler
```

**Important** : `MTN_MOMO_CALLBACK_HOST` doit pointer vers un domaine HTTPS
reellement accessible depuis l'exterieur (donc apres avoir termine les
etapes 5 et 6 de ce guide, certificat SSL compris) : sans cela, MTN ne
pourra jamais notifier tes serveurs qu'un paiement a ete confirme. Le
service continuera neanmoins a fonctionner correctement grace a
l'interrogation periodique de secours (`PaiementRelanceScheduler`), qui
verifie chaque transaction en attente toutes les 15 secondes independamment
du callback.

Une fois ces variables renseignees et le service redemarre, les paiements
MTN Mobile Money passent automatiquement par le vrai flux (invite PIN
envoyee sur le telephone du client, confirmation automatique) - **aucune
validation manuelle n'est necessaire**, sauf pour le paiement en agence qui
en a besoin par nature.

## 4. Premier demarrage (sans SSL, pour obtenir le certificat)

Avant d'avoir un certificat, on demarre avec la configuration Nginx "bootstrap"
(HTTP seul) :

```bash
cp deploiement/nginx-proxy-bootstrap.conf deploiement/nginx-proxy-actif.conf
```

Modifie temporairement `docker-compose.yml` pour que le service `proxy`
utilise `nginx-proxy-actif.conf` au lieu de `nginx-proxy.conf` (ou fais
simplement `cp deploiement/nginx-proxy-bootstrap.conf deploiement/nginx-proxy.conf`
en gardant une copie de l'original ailleurs), puis :

```bash
mvn -q -DskipTests clean package
docker compose --env-file .env.production up -d --build
```

Verifie que ca repond : `curl http://ton-domaine.com/api/live/evenements`
devrait renvoyer une liste JSON (vide au debut, c'est normal).

## 5. Obtenir le certificat SSL (Let's Encrypt / Certbot)

```bash
docker run --rm \
  -v /opt/myaddictive/deploiement/certbot/conf:/etc/letsencrypt \
  -v /opt/myaddictive/deploiement/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d ton-domaine.com --email ton-email@exemple.com --agree-tos --no-eff-email
```

Si ca reussit, les certificats apparaissent dans
`deploiement/certbot/conf/live/ton-domaine.com/`.

## 6. Activer la configuration HTTPS definitive

```bash
git checkout deploiement/nginx-proxy.conf  # ou restaure la copie que tu avais gardee
sed -i "s/VOTRE_DOMAINE.com/ton-domaine.com/g" deploiement/nginx-proxy.conf
docker compose restart proxy
```

Verifie : `https://ton-domaine.com` doit afficher le dashboard admin, avec un
cadenas valide dans le navigateur.

## 7. Renouvellement automatique du certificat

Let's Encrypt expire tous les 3 mois. Ajoute une tache planifiee :

```bash
crontab -e
```
Ajoute cette ligne (renouvellement verifie tous les jours a 3h, ne fait
rien si pas encore necessaire) :
```
0 3 * * * docker run --rm -v /opt/myaddictive/deploiement/certbot/conf:/etc/letsencrypt -v /opt/myaddictive/deploiement/certbot/www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot && docker compose -f /opt/myaddictive/docker-compose.yml restart proxy
```

## 8. Mettre a jour l'app mobile pour pointer vers la production

Dans `mobile-app/.env`, remplace l'adresse locale par l'adresse publique :
```
EXPO_PUBLIC_API_BASE_URL=https://ton-domaine.com/api
```
**Sans domaine (mode IP seule)** :
```
EXPO_PUBLIC_API_BASE_URL=http://IP_DU_VPS/api
```
**Important** : le prefixe `EXPO_PUBLIC_` est obligatoire (Expo SDK 49+),
sinon la variable est silencieusement ignoree et l'app retombe sur
`http://localhost:8090`.

Redemarre Expo (`start-tout.bat` ou `npx expo start` dans `mobile-app/`)
apres avoir modifie ce fichier, puis rescanne le QR code avec Expo Go —
l'app appelle desormais le VPS au lieu de ton PC local, donc plus besoin
d'etre sur le meme reseau Wi-Fi que le backend.

Pour une vraie mise en production (au-dela du mode developpement Expo Go),
deux options : generer un vrai build natif iOS/Android via EAS (voir la
documentation Expo), ou publier une version web installable (PWA) sur
Vercel, detaillee ci-dessous.

## 9. Deployer le front (PWA installable) sur Vercel

Le backend (les dix microservices) reste sur le VPS, en suivant les etapes
precedentes. L'application mobile, elle, peut aussi etre publiee comme
**site web installable** (PWA) sur Vercel : le lien s'ouvre dans le
navigateur, et un bouton "Ajouter a l'ecran d'accueil" (Android/Chrome) ou
"Sur l'ecran d'accueil" (iOS/Safari) permet de l'installer comme une vraie
application, avec le logo My Addictive comme icone, sans passer par un
store.

**1. Verifier que le backend du VPS est deja accessible en HTTPS**

La PWA doit appeler une adresse HTTPS publique (les navigateurs bloquent
les appels HTTP depuis un site HTTPS) : termine d'abord les etapes 3 a 7 de
ce guide (domaine + certificat SSL) avant de continuer.

**2. Pousser le depot vers GitHub**

Le depot Git est deja initialise a la racine du projet (un seul commit
initial propre, sans secrets ni fichiers volumineux — verifie par
`.gitignore`). Il ne reste qu'a creer un depot vide sur GitHub et a le
pousser :
```bash
cd /chemin/vers/myaddictive
# Cree un depot vide sur https://github.com/new (ne pas cocher "Initialiser avec un README"), puis :
git remote add origin https://github.com/ton-compte/myaddictive.git
git push -u origin main
```

**3. Importer le projet sur Vercel**

- Va sur https://vercel.com, connecte-toi (ou cree un compte), puis
  "Add New Project" et selectionne ton depot `myaddictive-mobile`.
- **Root Directory** : indique `mobile-app` (le depot contient tout le
  projet My Addictive, pas seulement l'app mobile).
- **Build Command** et **Output Directory** sont deja definis par le
  fichier `vercel.json` present dans `mobile-app/` (`npm run build:web`,
  sortie dans `dist/`) : Vercel les detecte automatiquement, rien a
  changer ici.

**4. Configurer la variable d'environnement essentielle**

Dans les parametres du projet Vercel (Settings > Environment Variables),
ajoute :
```
EXPO_PUBLIC_API_BASE_URL = https://ton-domaine.com/api
```
**Cette etape est indispensable** : sans elle, la PWA essaiera de joindre
`http://localhost:8090` (valeur par defaut de developpement) et rien ne
fonctionnera. Utilise l'adresse HTTPS publique de ton VPS (celle configuree
a l'etape 3 de ce guide), jamais une adresse locale.

**5. Deployer**

Clique sur "Deploy". Vercel construit le projet et fournit une URL du type
`https://myaddictive-mobile.vercel.app` (personnalisable ensuite avec un
nom de domaine propre depuis les parametres du projet).

**6. Installer sur un telephone**

- **Android / Chrome** : ouvre le lien, un bandeau "Ajouter a l'ecran
  d'accueil" apparait automatiquement (ou via le menu ⋮ > "Installer
  l'application"). L'icone du logo apparait alors comme une vraie
  application, lancee en plein ecran (sans barre d'adresse).
- **iPhone / Safari** : ouvre le lien, appuie sur le bouton de partage
  (carre avec une fleche vers le haut), puis "Sur l'ecran d'accueil".
  Safari ne propose pas ce bouton automatiquement comme Chrome : c'est
  une limitation d'Apple, pas un reglage manquant du projet.

Chaque redeploiement (nouveau `git push`) republie automatiquement la PWA
sur la meme URL, sans que les utilisateurs aient besoin de reinstaller
quoi que ce soit.

## Utilisation courante apres le premier deploiement

```bash
cd /opt/myaddictive

# Redeployer apres une modification du code :
./deployer.sh

# Voir les logs en direct :
docker compose logs -f

# Voir les logs d'un seul service :
docker compose logs -f compte-service

# Redemarrer un service precis :
docker compose restart compte-service

# Tout arreter :
docker compose down

# Etat des conteneurs :
docker compose ps
```

## Sauvegardes

Les donnees (bases H2, images uploadees) vivent dans des volumes Docker
nommes, persistants entre les redeploiements. Pour les sauvegarder :

```bash
docker run --rm -v myaddictive_data_compte:/data -v $(pwd)/sauvegardes:/backup \
  alpine tar czf /backup/data_compte_$(date +%Y%m%d).tar.gz -C /data .
```
(a repeter pour chaque volume : data_media, data_musique, uploads_media, etc.
— pense a planifier ca aussi via cron.)

## En cas de probleme

```bash
docker compose ps                    # un conteneur en boucle de redemarrage ?
docker compose logs nom-du-service   # message d'erreur precis
```

Les causes les plus frequentes : `JWT_SECRET` non defini dans
`.env.production`, DNS pas encore propage, port 80/443 deja utilise par un
autre service sur le VPS (`netstat -tlnp | grep -E ':80|:443'`).
