package bj.myaddictive.musique.config;

import bj.myaddictive.musique.domain.Titre;
import bj.myaddictive.musique.repository.TitreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * ANNULE le complement d'images de demonstration (Picsum Photos) applique
 * precedemment aux titres sans pochette. Choix revu : plutot que d'afficher
 * une photo generique sans rapport avec le titre, l'app affiche desormais
 * l'icone "coupee" du logo My Addictive cote client (voir IconePlaceholder)
 * pour tout titre dont imageUrl est null. Remettre imageUrl a null pour les
 * lignes encore marquees par l'ancien correctif est donc necessaire pour
 * que ce nouveau comportement se declenche.
 *
 * Idempotent : ne fait rien une fois toutes les lignes Picsum nettoyees.
 */
@Component
@Order(2)
public class CompleteurImagesTitres implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CompleteurImagesTitres.class);
    private static final String MARQUEUR_DEMO = "picsum.photos";

    private final TitreRepository titreRepository;

    public CompleteurImagesTitres(TitreRepository titreRepository) {
        this.titreRepository = titreRepository;
    }

    @Override
    public void run(String... args) {
        List<Titre> avecImageDemo = titreRepository.findAll().stream()
                .filter(t -> t.getImageUrl() != null && t.getImageUrl().contains(MARQUEUR_DEMO))
                .toList();
        if (avecImageDemo.isEmpty()) {
            log.info("Aucune image de demonstration a nettoyer sur les titres.");
            return;
        }
        for (Titre t : avecImageDemo) {
            t.setImageUrl(null);
        }
        titreRepository.saveAll(avecImageDemo);
        log.info("Images de demonstration retirees de {} titres (l'icone du logo s'affiche desormais a la place).", avecImageDemo.size());
    }
}
