package bj.myaddictive.live.config;

import bj.myaddictive.live.domain.Chaine;
import bj.myaddictive.live.repository.ChaineRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

/**
 * Import ponctuel des artistes/organisateurs de l'ancien site My Addictive
 * (tables mya_artiste + mya_artiste2, dedoublonnees par nom), convertis en
 * Chaine, a partir de resources/legacy/chaines_legacy.json.
 */
@Component
@Order(1)
public class ImporteurLegacyChaines implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ImporteurLegacyChaines.class);
    private static final String FICHIER = "legacy/chaines_legacy.json";

    private final ChaineRepository chaineRepository;

    public ImporteurLegacyChaines(ChaineRepository chaineRepository) {
        this.chaineRepository = chaineRepository;
    }

    private record LigneImport(
            String nom, String description, String imageUrl, Long nombreAbonnes,
            String sourceLegacyId, String sourceLegacyTable) {
    }

    @Override
    public void run(String... args) throws Exception {
        if (chaineRepository.count() > 3) {
            log.info("Import legacy des chaines deja effectue ({} chaines en base), etape ignoree.", chaineRepository.count());
            return;
        }

        ClassPathResource ressource = new ClassPathResource(FICHIER);
        if (!ressource.exists()) {
            log.info("Aucun fichier {} trouve, import legacy ignore.", FICHIER);
            return;
        }

        ObjectMapper mapper = new ObjectMapper();
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
                if (ligne.nom() == null || ligne.nom().isBlank()) continue;
                Chaine c = new Chaine();
                c.setNom(ligne.nom());
                c.setDescription(ligne.description());
                c.setImageUrl(ligne.imageUrl());
                c.setNombreAbonnes(0L);
                chaineRepository.save(c);
                importes++;
            } catch (Exception e) {
                erreurs++;
                log.warn("Ligne ignoree lors de l'import legacy (chaine source id={}) : {}", ligne.sourceLegacyId(), e.getMessage());
            }
        }
        log.info("Import legacy des chaines termine : {} chaines creees, {} en erreur (sur {} lignes source).", importes, erreurs, lignes.size());
    }
}
