package bj.myaddictive.media.config;

import bj.myaddictive.media.domain.OffrePromotion;
import bj.myaddictive.media.repository.OffrePromotionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Cree la grille tarifaire standard de promotion (section 4.1 : pack de
 * base, A1, A2, A3) au premier demarrage si elle n'existe pas encore.
 * Les montants sont indicatifs ; a ajuster par la direction (section 15,
 * "les parametres de tarification detailles restent definis par la
 * direction").
 */
@Component
public class AmorceOffresPromotion implements CommandLineRunner {

    private final OffrePromotionRepository offrePromotionRepository;

    public AmorceOffresPromotion(OffrePromotionRepository offrePromotionRepository) {
        this.offrePromotionRepository = offrePromotionRepository;
    }

    @Override
    public void run(String... args) {
        if (offrePromotionRepository.count() > 0) return;

        creer("BASE", "Pack Base", "Mise en avant de votre profil artiste sur 7 jours.", 5000L, 7);
        creer("A1", "Pack A1", "Article sponsorise + partage reseaux sociaux, 15 jours.", 15000L, 15);
        creer("A2", "Pack A2", "Mise a la une + notification aux abonnes, 30 jours.", 35000L, 30);
        creer("A3", "Pack A3", "Visibilite maximale : une + notifications + reseaux, 60 jours.", 75000L, 60);
    }

    private void creer(String code, String nom, String description, Long prixFcfa, Integer dureeJours) {
        OffrePromotion offre = new OffrePromotion();
        offre.setCode(code);
        offre.setNom(nom);
        offre.setDescription(description);
        offre.setPrixFcfa(prixFcfa);
        offre.setDureeJours(dureeJours);
        offrePromotionRepository.save(offre);
    }
}
