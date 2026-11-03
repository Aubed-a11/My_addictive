package bj.myaddictive.live.config;

import bj.myaddictive.live.domain.Chaine;
import bj.myaddictive.live.repository.ChaineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * ANNULE le complement d'images de demonstration (Picsum Photos) applique
 * precedemment aux chaines/artistes sans portrait. Meme choix revu que pour
 * CompleteurImagesTitres (musique-service) : l'icone "coupee" du logo My
 * Addictive s'affiche desormais cote client (voir IconePlaceholder) pour
 * toute chaine dont imageUrl est null, plutot qu'une photo generique.
 * Idempotent : ne fait rien une fois toutes les lignes Picsum nettoyees.
 */
@Component
@Order(2)
public class CompleteurImagesChaines implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CompleteurImagesChaines.class);
    private static final String MARQUEUR_DEMO = "picsum.photos";

    private final ChaineRepository chaineRepository;

    public CompleteurImagesChaines(ChaineRepository chaineRepository) {
        this.chaineRepository = chaineRepository;
    }

    @Override
    public void run(String... args) {
        List<Chaine> avecImageDemo = chaineRepository.findAll().stream()
                .filter(c -> c.getImageUrl() != null && c.getImageUrl().contains(MARQUEUR_DEMO))
                .toList();
        if (avecImageDemo.isEmpty()) {
            log.info("Aucune image de demonstration a nettoyer sur les chaines.");
            return;
        }
        for (Chaine c : avecImageDemo) {
            c.setImageUrl(null);
        }
        chaineRepository.saveAll(avecImageDemo);
        log.info("Images de demonstration retirees de {} chaines (l'icone du logo s'affiche desormais a la place).", avecImageDemo.size());
    }
}
