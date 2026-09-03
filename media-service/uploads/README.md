# Fichiers images legacy

Ce dossier est servi tel quel par media-service sous `/api/media/fichiers/**`
(voir `ConfigurationFichiersStatiques.java`). Les donnees importees depuis
l'ancien site (albums, titres) pointent deja vers les bons chemins ici :

```
uploads/artistes/albums/{numero}/small_{fichier}
uploads/artistes/tracks/{numero}/{fichier}
```

## Comment recuperer les vrais fichiers

Ces images sont hebergees sur l'ancien site (myaddictive.com), sur le meme
hebergement OVH que la base de donnees. Pour les recuperer :

1. Depuis le dashboard OVH : Web & Domaines > Hebergement > myaddictive.com
   > FTP / SSH.
2. Connecte-toi avec un client FTP (FileZilla par exemple) ou le WebFTP
   propose directement dans le dashboard.
3. Navigue jusqu'a :
   `wp-content/themes/mya/assets/images/artistes/albums/`
   et
   `wp-content/themes/mya/assets/images/artistes/tracks/`
4. Telecharge ces deux dossiers entiers (ils contiennent un sous-dossier par
   numero d'album/titre).
5. Copie-les ici en conservant exactement la meme structure :
   - le contenu de `.../albums/` -> `uploads/artistes/albums/`
   - le contenu de `.../tracks/` -> `uploads/artistes/tracks/`

Une fois les fichiers en place, redemarre media-service (ou tout le
backend) : les images s'afficheront immediatement dans l'app, sans autre
changement necessaire, puisque les chemins stockes en base correspondent
deja exactement a cette arborescence.

## Note

Seuls les dossiers `albums/` et `tracks/` sont confirmes avec certitude
(des liens absolus vers ces memes chemins ont ete retrouves dans le contenu
d'origine de la base). Les portraits d'artistes et les images d'actualites
n'ont pas de schema d'hebergement confirme et ne sont donc pas importes
pour l'instant (voir le rapport d'import dans les logs de media-service et
live-service au demarrage).
