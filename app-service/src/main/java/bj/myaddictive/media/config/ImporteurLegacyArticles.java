package bj.myaddictive.media.config;

import bj.myaddictive.media.domain.Article;
import bj.myaddictive.media.repository.ArticleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

/**
 * Import ponctuel des articles et des clips video de l'ancien site My
 * Addictive (tables mya_actualites et mya_videosemaine), a partir de
 * resources/legacy/articles_legacy.json et videos_legacy.json. Les deux
 * imports sont independants (chacun avec sa propre garde de "deja
 * effectue"), pour pouvoir ajouter l'un sans re-executer l'autre.
 */
@Component
public class ImporteurLegacyArticles implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ImporteurLegacyArticles.class);

    private final ArticleRepository articleRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    public ImporteurLegacyArticles(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    private record LigneImport(
            String titre, String chapo, String contenu, String imageUrl, String videoUrl, String categorie,
            boolean aLaUne, String statut, Long compteurVues, String sourceLegacyId) {
    }

    @Override
    public void run(String... args) throws Exception {
        importerDepuisFichier("legacy/articles_legacy.json", "articles", articleRepository.count() > 3);
        importerDepuisFichier("legacy/videos_legacy.json", "videos", articleRepository.countByCategorie("VIDEO") > 3);
    }

    private void importerDepuisFichier(String fichier, String libelle, boolean dejaEffectue) throws Exception {
        if (dejaEffectue) {
            log.info("Import legacy des {} deja effectue, etape ignoree.", libelle);
            return;
        }

        ClassPathResource ressource = new ClassPathResource(fichier);
        if (!ressource.exists()) {
            log.info("Aucun fichier {} trouve, import legacy ignore.", fichier);
            return;
        }

        List<LigneImport> lignes;
        try (InputStream in = ressource.getInputStream()) {
            lignes = mapper.readValue(in, mapper.getTypeFactory().constructCollectionType(List.class, LigneImport.class));
        }

        // Pas de @Transactional global : une ligne de donnees problematique ne
        // doit jamais faire echouer tout l'import ni empecher le demarrage.
        int importes = 0;
        int erreurs = 0;
        for (LigneImport ligne : lignes) {
            try {
                if (ligne.titre() == null || ligne.titre().isBlank()) continue;
                Article a = new Article();
                a.setTitre(ligne.titre());
                a.setChapo(ligne.chapo());
                a.setContenu(ligne.contenu() != null ? ligne.contenu() : "");
                a.setImageUrl(ligne.imageUrl());
                a.setVideoUrl(ligne.videoUrl());
                a.setCategorie(ligne.categorie() != null ? ligne.categorie() : "ACTUALITE");
                a.setALaUne(ligne.aLaUne());
                a.setStatut(ligne.statut() != null ? ligne.statut() : "PUBLIE");
                a.setCompteurVues(ligne.compteurVues() != null ? ligne.compteurVues() : 0L);
                articleRepository.save(a);
                importes++;
            } catch (Exception e) {
                erreurs++;
                log.warn("Ligne ignoree lors de l'import legacy {} (source id={}) : {}", libelle, ligne.sourceLegacyId(), e.getMessage());
            }
        }
        log.info("Import legacy des {} termine : {} crees, {} en erreur (sur {} lignes source).", libelle, importes, erreurs, lignes.size());
    }
}
