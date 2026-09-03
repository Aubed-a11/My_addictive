package bj.myaddictive.live.config;

import bj.myaddictive.live.domain.Evenement;
import bj.myaddictive.live.domain.StatutEvenement;
import bj.myaddictive.live.repository.EvenementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Evenements de demonstration (billetterie/live, section 6), avec de
 * vraies images (Picsum Photos, libre d'utilisation). Melange de statuts
 * (a venir / en direct) pour illustrer les differents ecrans. Idempotent :
 * ne s'execute qu'une seule fois (garde sur le nombre d'evenements deja en
 * base).
 */
@Component
@Order(2)
public class AmorceEvenementsDemo implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AmorceEvenementsDemo.class);
    private static final String MARQUEUR = "[DEMO]";

    private final EvenementRepository evenementRepository;

    public AmorceEvenementsDemo(EvenementRepository evenementRepository) {
        this.evenementRepository = evenementRepository;
    }

    private record LigneEvenement(String titre, String lieu, StatutEvenement statut, int joursDecalage,
                                   long prixStandard, long prixVip, int grainePhoto) {}

    @Override
    public void run(String... args) {
        boolean dejaFait = evenementRepository.findAll().stream().anyMatch(e -> e.getTitre() != null && e.getTitre().startsWith(MARQUEUR));
        if (dejaFait) {
            log.info("Evenements de demonstration deja crees, etape ignoree.");
            return;
        }

        List<LigneEvenement> lignes = List.of(
                new LigneEvenement("Concert Addictive Live", "Palais des Congres, Cotonou", StatutEvenement.EN_DIRECT, 0, 5000, 15000, 701),
                new LigneEvenement("Festival Urban Vibes", "Stade de l'Amitie, Cotonou", StatutEvenement.A_VENIR, 7, 8000, 20000, 702),
                new LigneEvenement("Nuit du Slam", "Institut Francais, Cotonou", StatutEvenement.A_VENIR, 14, 3000, 10000, 703),
                new LigneEvenement("Showcase Nouvelle Scene", "Le Zenith, Cotonou", StatutEvenement.A_VENIR, 21, 2000, 8000, 704),
                new LigneEvenement("Addictive Awards 2026", "Palais des Congres, Cotonou", StatutEvenement.A_VENIR, 30, 10000, 25000, 705)
        );

        int cpt = 0;
        for (LigneEvenement l : lignes) {
            Evenement e = new Evenement();
            e.setTitre(MARQUEUR + " " + l.titre());
            e.setLieu(l.lieu());
            e.setImageUrl("https://picsum.photos/seed/" + l.grainePhoto() + "/800/500");
            e.setDateDebut(Instant.now().plus(l.joursDecalage(), ChronoUnit.DAYS));
            e.setStatut(l.statut());
            e.setPayant(true);
            e.setPrixStandardFcfa(l.prixStandard());
            e.setPrixVipFcfa(l.prixVip());
            evenementRepository.save(e);
            cpt++;
        }

        log.info("Evenements de demonstration crees : {}.", cpt);
    }
}
