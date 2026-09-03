package bj.myaddictive.votes.controller;

import bj.myaddictive.votes.domain.MouvementPortefeuille;
import bj.myaddictive.votes.domain.Portefeuille;
import bj.myaddictive.votes.repository.MouvementPortefeuilleRepository;
import bj.myaddictive.votes.repository.PortefeuilleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoint interne appele directement par paiement-service (resolu via
 * Eureka) apres confirmation d'un paiement de type PORTEFEUILLE_PIECES.
 * Remplace l'ancien @RabbitListener. referenceId transporte le nombre de
 * pieces achetees.
 *
 * NB : cet appel n'est pas idempotent par transactionId (contrairement aux
 * autres services) car crediter un portefeuille est additif ; en pratique
 * paiement-service n'appelle ce endpoint qu'une seule fois par transaction
 * confirmee (voir PaiementService.traiterWebhook).
 */
@RestController
@RequestMapping("/api/interne")
public class InterneController {

    private static final Logger log = LoggerFactory.getLogger(InterneController.class);
    private final PortefeuilleRepository portefeuilleRepository;
    private final MouvementPortefeuilleRepository mouvementPortefeuilleRepository;

    public InterneController(PortefeuilleRepository portefeuilleRepository,
                              MouvementPortefeuilleRepository mouvementPortefeuilleRepository) {
        this.portefeuilleRepository = portefeuilleRepository;
        this.mouvementPortefeuilleRepository = mouvementPortefeuilleRepository;
    }

    @PostMapping("/paiement-confirme")
    @Transactional
    public ResponseEntity<Void> surPaiementConfirme(@RequestBody Map<String, Object> evenement) {
        Long utilisateurId = Long.valueOf(String.valueOf(evenement.get("utilisateurId")));
        long nombrePieces = Long.parseLong(String.valueOf(evenement.get("referenceId")));

        Portefeuille portefeuille = portefeuilleRepository.findByUtilisateurId(utilisateurId)
                .orElseGet(() -> {
                    Portefeuille p = new Portefeuille();
                    p.setUtilisateurId(utilisateurId);
                    p.setSolde(0L);
                    return p;
                });
        portefeuille.setSolde(portefeuille.getSolde() + nombrePieces);
        portefeuilleRepository.save(portefeuille);

        MouvementPortefeuille mouvement = new MouvementPortefeuille();
        mouvement.setUtilisateurId(utilisateurId);
        mouvement.setMontant(nombrePieces);
        mouvement.setMotif("Achat de pieces");
        mouvementPortefeuilleRepository.save(mouvement);

        log.info("{} pieces creditees a l'utilisateur {}.", nombrePieces, utilisateurId);
        return ResponseEntity.ok().build();
    }
}
