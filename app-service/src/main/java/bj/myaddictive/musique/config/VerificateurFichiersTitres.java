package bj.myaddictive.musique.config;

import bj.myaddictive.musique.domain.Titre;
import bj.myaddictive.musique.repository.TitreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Verifie que chaque imageUrl/fichierAudioUrl construit pour un titre
 * pointe vers un fichier qui existe REELLEMENT sur le disque (dans
 * media-service/uploads/, seul un echantillon limite de titres a pu
 * recuperer ses vrais fichiers depuis l'hebergement d'origine - voir
 * README). Sans cette verification, un chemin "construit" mais casse
 * (fichier absent) ne declenche jamais le repli visuel vers l'icone du
 * logo cote client : l'URL n'est pas null, donc <Image> essaie de charger
 * un fichier introuvable et n'affiche rien du tout, silencieusement.
 *
 * Defensif par construction : toute erreur inattendue (chemin illisible,
 * permission refusee...) est rattrapee et journalisee sans jamais faire
 * echouer le demarrage du service - un CommandLineRunner qui leve une
 * exception non geree est traite par Spring Boot comme une erreur fatale
 * qui arrete TOUT le service, ce qu'on veut absolument eviter ici puisque
 * cette verification est un simple "nice to have", pas une etape critique.
 *
 * Idempotent : ne fait rien une fois toutes les URLs cassees nettoyees.
 */
@Component
@Order(3)
public class VerificateurFichiersTitres implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(VerificateurFichiersTitres.class);
    // Dossier reel des fichiers televerses (meme dossier que celui servi par le domaine media).
    @org.springframework.beans.factory.annotation.Value("${media.uploads-path:./uploads/}")
    private String racineFichiers;
    private static final String PREFIXE_URL = "/api/media/fichiers";

    private final TitreRepository titreRepository;

    public VerificateurFichiersTitres(TitreRepository titreRepository) {
        this.titreRepository = titreRepository;
    }

    private boolean fichierExiste(String url) {
        try {
            if (url == null || !url.startsWith(PREFIXE_URL)) return true; // pas notre convention, on ne touche pas
            String cheminRelatif = url.substring(PREFIXE_URL.length());
            return new File(racineFichiers + cheminRelatif).isFile();
        } catch (Exception e) {
            // En cas de doute (chemin illisible, permission...), on ne touche pas
            // a la donnee plutot que de risquer de casser quelque chose qui marchait.
            return true;
        }
    }

    @Override
    public void run(String... args) {
        try {
            // Garde-fou : si le dossier des fichiers est introuvable ou vide (volume non monte,
            // mauvais chemin), on ne touche surtout pas aux donnees : tout paraitrait "casse".
            File racine = new File(racineFichiers);
            String[] contenu = racine.list();
            if (!racine.isDirectory() || contenu == null || contenu.length == 0) {
                log.warn("Verification des fichiers titres : dossier {} introuvable ou vide, verification ignoree.", racineFichiers);
                return;
            }
            if (racineFichiers.endsWith("/")) racineFichiers = racineFichiers.substring(0, racineFichiers.length() - 1);
            List<Titre> tous = titreRepository.findAll();
            List<Titre> aSauvegarder = new ArrayList<>();
            int corrigesImage = 0;
            int corrigesAudio = 0;
            for (Titre t : tous) {
                boolean modifie = false;
                if (t.getImageUrl() != null && !fichierExiste(t.getImageUrl())) {
                    t.setImageUrl(null);
                    corrigesImage++;
                    modifie = true;
                }
                if (t.getFichierAudioUrl() != null && !fichierExiste(t.getFichierAudioUrl())) {
                    t.setFichierAudioUrl(null);
                    corrigesAudio++;
                    modifie = true;
                }
                if (modifie) aSauvegarder.add(t);
            }
            if (!aSauvegarder.isEmpty()) {
                titreRepository.saveAll(aSauvegarder);
                log.info("Verification des fichiers titres : {} imageUrl et {} fichierAudioUrl casses (fichier absent) remis a null.", corrigesImage, corrigesAudio);
            } else {
                log.info("Verification des fichiers titres : rien a corriger, toutes les URLs pointent vers de vrais fichiers.");
            }
        } catch (Exception e) {
            // Ne doit JAMAIS empecher le service de demarrer : cette verification
            // est une amelioration de confort d'affichage, pas une etape critique.
            log.error("Verification des fichiers titres : erreur non bloquante, etape ignoree.", e);
        }
    }
}
