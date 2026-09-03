# My Addictive — plateforme mobile multi-services

Implementation du cahier des charges "My Addictive" : backend en
microservices Spring Boot (architecture complete a 10 services) et frontend
mobile en **React Native (Expo)**, connectes de bout en bout.

> **Perimetre de cette iteration** : les six rubriques sont couvertes
> (Media, Musique, Billetterie & Live, Competitions & Votes, Boutique, Mon
> compte), **a l'exception du module Radio**, explicitement retire du
> perimetre a la demande du commanditaire. Le contenu de base de chaque
> rubrique (section correspondante du cahier des charges) est implemente ;
> certaines "idees avancees" (mode hors ligne, fan club, badges, drops
> limites...) sont a construire dans une iteration suivante — voir
> "Prochaines etapes" en fin de document.

## Fonctionne sans Docker

Ce projet tourne **directement en Java, sans Docker ni serveur externe a
installer** :
- **PostgreSQL** est remplace par **H2** (base embarquee, un fichier par
  service dans `./data/`) — zero installation.
- **RabbitMQ** est remplace par un **appel HTTP direct entre services**
  (resolu via Eureka) au moment de la confirmation de paiement — meme
  regle de gestion (aucun titre/billet/piece/commande avant confirmation),
  meme idempotence, juste sans broker de messages a faire tourner.
- **Redis** est remplace par des **compteurs en memoire** pour le nombre
  de spectateurs en direct et le classement des votes — parfaitement
  adapte a un usage local/demo sur une seule instance.
- **MinIO** n'etait pas encore reellement utilise dans le code (juste
  prevu en configuration) : retire sans impact.

Consequence : plus besoin de Docker Desktop ni d'aucun conteneur. Il faut
juste un JDK 17+, Maven et Node.js installes sur la machine.

## Tout demarrer en une seule commande

Prerequis sur ta machine :
- **Java 17+ (JDK)** — https://adoptium.net
- **Maven** — https://maven.apache.org/download.cgi
- **Node.js + npm** — https://nodejs.org
- L'app **Expo Go** installee sur ton telephone (ou un emulateur
  Android/iOS)

**Sous macOS / Linux :**
```bash
cd myaddictive
./start-tout.sh
```

**Sous Windows :** double-clique simplement sur `start-tout.bat` dans
l'explorateur de fichiers, ou depuis l'invite de commandes (cmd) :
```
cd myaddictive
start-tout.bat
```
(ou, depuis PowerShell : `.\start-tout.ps1`). Le script `.sh` ne fonctionne
pas sous cmd/PowerShell — c'est normal, utilise `start-tout.bat`.

Ce script (identique dans les deux versions) :
1. Compile les 10 microservices en un seul build Maven (reactor multi-module).
2. Les lance directement en Java, dans l'ordre (annuaire de services,
   configuration centralisee, puis les 7 services metier, puis la
   gateway), avec les logs de chacun dans le dossier `logs/`.
3. Attend que la gateway reponde.
4. Detecte automatiquement l'IP locale de ta machine pour que ton
   telephone (sur le meme Wi-Fi) puisse joindre le backend.
5. Configure et lance l'app mobile (Expo) — il ne reste qu'a scanner le
   QR code affiche dans le terminal avec l'app Expo Go.

Pour tout arreter : `./stop-tout.sh` (macOS/Linux) ou `stop-tout.bat`
(Windows) — ca arrete proprement les 10 processus Java. Puis Ctrl+C dans
le terminal Expo pour arreter l'app mobile.

Si tu preferes tout piloter a la main (deboguer un service en particulier,
utiliser un emulateur, etc.), le detail service par service est plus bas.

## Back-office administrateur (React web)

Un dashboard web separe (`admin-dashboard/`, React + Vite) permet de gerer
dynamiquement le contenu programmable de l'app : evenements (creer/
programmer/modifier/supprimer), competitions et candidats, articles,
titres/albums musique, catalogue boutique, et validation des demandes
d'ouverture de boutique (vendeurs). La page d'accueil met en avant les
evenements a venir.

```bash
cd admin-dashboard
npm install
cp .env.example .env   # ajuster VITE_API_BASE_URL si besoin (par defaut http://localhost:8090)
npm run dev
```

Ouvrir http://localhost:5173. Un compte administrateur est cree
automatiquement au premier demarrage de `compte-service` :
- Email : `admin@myaddictive.com` (configurable via `ADMIN_EMAIL` dans `.env`)
- Mot de passe : `AdminAddictive2026!` (configurable via `ADMIN_MOT_DE_PASSE`)

**A changer immediatement si ce projet sort du cadre local/demo.** Les
endpoints de creation/modification/suppression (evenements, competitions,
candidats, titres, albums, produits, articles) verifient le role
`ADMINISTRATEUR` du jeton JWT ; la gateway n'exige une connexion que pour
les methodes d'ecriture (POST/PUT/DELETE), la consultation (GET) reste
libre pour l'app mobile.

## Idees avancees implementees

En plus du contenu de base, cinq "idees avancees" explicitement listees
dans le cahier des charges ont ete ajoutees :

- **Mode hors ligne (section 5.2)** : telechargement local des titres
  gratuits ou deja achetes (`expo-file-system`, stockage prive au bac a
  sable de l'app), ecran "Mes telechargements". Limite assumee : ce n'est
  pas un chiffrement DRM au sens strict, juste un stockage prive non
  accessible depuis un explorateur de fichiers classique — a renforcer
  avant une mise en production a grande echelle.
- **Fan club / abonnement artiste (section 9.2)** : abonnement mensuel
  payant a une chaine (2000 FCFA, reconductible), acces anticipe et badge
  visible sur la fiche chaine, integre au meme socle de paiement que le
  reste de l'app (`TypeObjetPaiement.FAN_CLUB`).
- **Badges de fidelite (section 9.2)** : 5 paliers (Debutant a Platine)
  calcules a partir de l'activite reelle (votes, billets, achats), sans
  necessiter de nouvelle donnee cote backend.
- **Drops limites boutique (section 8.2)** : compte a rebours en direct
  avant mise en vente, achat bloque tant que le drop n'est pas ouvert,
  gestion depuis le dashboard admin.
- **Recommandations personnalisees (sections 4.2 et 5.2)** : titres
  musicaux recommandes selon le genre le plus ecoute dans l'historique
  personnel ; articles media reordonnances selon les chaines/artistes
  suivis par l'utilisateur.

## Architecture

```
Client React Native (Expo)
        │
        ▼
  gateway-service (Spring Cloud Gateway, port 8090)
   │  routage + verification JWT sur les routes d'action
   ▼
 ┌────────────┬──────────────┬─────────────┬──────────────┬────────────────┬──────────────────┐
 compte-service media-service musique-service live-service votes-service boutique-service  paiement-service
 (8091)         (8082)        (8083)         (8084)        (8085)         (8086)             (8087)
        │              │             │              │             │               │                │
        └──────────────┴─────────────┴──────────────┴─────────────┴───────────────┴────────────────┘
                                    │
                  H2 (1 fichier par service, dans ./data/) · compteurs temps reel en memoire

  discovery-service (Eureka, 8761)  +  config-service (Spring Cloud Config, 8888)
```

Regle d'or respectee de bout en bout : **aucune emission de titre, billet,
piece ou commande avant confirmation du paiement**. `paiement-service`
notifie directement (appel HTTP resolu via Eureka) le microservice
concerne uniquement apres confirmation ; chaque service cible verifie
l'idempotence (ne traite jamais deux fois la meme transaction) avant de
debloquer le contenu.

## Demarrer manuellement, service par service (pour deboguer)

Sans passer par `start-tout.sh`/`.ps1` :

```bash
cd myaddictive
mvn -DskipTests package        # compile tout d'un coup

# Dans des terminaux separes, dans cet ordre :
java -jar discovery-service/target/discovery-service-*.jar
java -jar config-service/target/config-service-*.jar
java -jar compte-service/target/compte-service-*.jar
java -jar media-service/target/media-service-*.jar
java -jar musique-service/target/musique-service-*.jar
java -jar live-service/target/live-service-*.jar
java -jar votes-service/target/votes-service-*.jar
java -jar boutique-service/target/boutique-service-*.jar
java -jar paiement-service/target/paiement-service-*.jar
java -jar gateway-service/target/gateway-service-*.jar
```

Services exposes :
- Gateway (point d'entree de l'app) : http://localhost:8090
- Eureka (annuaire) : http://localhost:8761
- Console H2 de chaque service (inspection de la base) : ex.
  http://localhost:8091/h2-console (JDBC URL affichee dans les logs du
  service au demarrage)

**Mode simulation des paiements** : tant que `MTN_MOMO_API_KEY` (et
equivalents) ne sont pas renseignes dans `.env`, `paiement-service`
confirme automatiquement chaque transaction pour permettre de tester toute
la chaine (achat → paiement → deblocage) sans compte agregateur reel.
Brancher les vraies API mobile money avant la mise en production.

## Demarrer l'application mobile seule

```bash
cd mobile-app
npm install
cp .env.example .env
# Emulateur Android : EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8090
# Telephone physique : EXPO_PUBLIC_API_BASE_URL=http://<IP-de-votre-machine>:8090
npx expo start
```

Scanner le QR code avec Expo Go, ou lancer sur un emulateur (`npx expo
start --android` / `--ios`), ou dans un navigateur (`npx expo start
--web`, necessite `npx expo install react-native-web react-dom
@expo/metro-runtime` une seule fois).

## Ce qui est reellement implemente (pas des maquettes)

- **Demarrage** : ecran de splash anime (logo, slogan, barre de
  chargement) puis, a la toute premiere ouverture uniquement, un
  onboarding en 3 ecrans (`AsyncStorage` retient que l'utilisateur l'a deja
  vu). Design aligne sur l'identite de marque reelle (logo reproduit en
  SVG : spirale or + "ddictive" en bleu sarcelle + "My" en police
  cursive). Pour revoir l'onboarding en test, vide les donnees de l'app
  (ou `AsyncStorage.clear()` depuis le debogueur).
- **Authentification** : inscription par telephone + OTP (SMS simule,
  code trace dans les logs de `compte-service`), connexion, mot de passe
  oublie, JWT emis par `compte-service` et verifie par `gateway-service`.
- **Musique** (hors radio) : titres gratuits/payants, albums, classements,
  achat integre au paiement.
- **Billetterie & Live** : evenements (a venir/en direct/replay), achat de
  billet avec code QR genere et affiche cote app, scan/validation du
  billet, compteur de spectateurs temps reel, **chat en direct fonctionnel**
  (section 6.5), **sondages en direct avec vote unique et resultats en
  temps reel** (creation et cloture depuis le dashboard admin), chaines
  avec **page dediee listant leurs evenements** (section 6.3) et
  abonnements, podcasts et episodes **avec abonnement** (section 6.4).
- **Media** : articles, a la une, **partage natif sur les reseaux sociaux**
  (section 4.1), **grille des offres de promotion** pour les artistes.
- **Competitions & Votes** : competitions par phase, candidats (avec fiche
  et extrait video), portefeuille de pieces (achat via paiement-service),
  vote payant, **classement pondere** combinant vote du public et note du
  jury selon les coefficients de la competition (section 7.1), historique
  personnel des votes.
- **Boutique** : marketplace multi-vendeurs generaliste, demande
  d'ouverture de boutique (validation admin), catalogue produits, panier,
  commande multi-vendeurs avec repartition automatique par vendeur, decompte
  du stock apres paiement confirme.
- **Mon compte** : profil, favoris, historique d'ecoute, historique de
  votes, verification de transaction, raccourcis vers billets/achats/
  commandes/portefeuille.

## A brancher avant une mise en production

- Integration reelle des agregateurs mobile money (MTN MoMo, Moov Money,
  Celtiis Cash) dans `paiement-service` (`initierAupresAgregateur()`),
  desactivation du mode simulation.
- Envoi reel des SMS OTP (`OtpService.envoyerCode()`).
- Lecteur audio/video reel cote React Native (ex. `expo-av` ou
  `react-native-video`) branche sur `fichierAudioUrl` / `urlFlux` /
  `urlReplay`.
- Integration STOMP cote client (actuellement le classement et le
  compteur de spectateurs sont rafraichis par sondage REST ; les canaux
  WebSocket `/ws-live` et `/ws-votes` existent deja cote backend).
- **Passage a une architecture multi-instance / production** : remettre
  PostgreSQL (au lieu de H2), Redis (compteurs partages entre instances)
  et un vrai broker de messages comme RabbitMQ (notification de paiement
  tolerante aux pannes, avec re-livraison) — ce depot en contient toute la
  logique metier, il s'agit surtout de reintroduire les adaptateurs
  d'infrastructure correspondants.
- Passage du JWT de HS256 a RS256 (cle privee dans `compte-service`, cles
  publiques distribuees) comme prevu section 21.3 du cahier des charges.
- Back office d'administration (partie III du cahier des charges) : les
  endpoints de validation existent (ex. changement de statut vendeur),
  l'interface web dediee reste a construire.
- Authentification/signature des appels internes entre services
  (actuellement en clair sur le reseau local, sans verification).

## Prochaines etapes suggerees

1. Brancher un vrai fournisseur SMS et un vrai agregateur mobile money.
2. Construire le back office web (React ou autre) consommant les memes
   APIs.
3. Ajouter les "idees avancees" prioritaires : mode hors ligne musique,
   fan club/abonnement, badges de fidelite, drops limites Boutique.
4. Mettre en place l'observabilite (Spring Boot Actuator + centralisation
   des logs) et les tests automatises par service avant la CI/CD decrite
   section 23.3 du cahier des charges, et re-basculer vers PostgreSQL/
   Redis/RabbitMQ en environnement de production multi-instance.
