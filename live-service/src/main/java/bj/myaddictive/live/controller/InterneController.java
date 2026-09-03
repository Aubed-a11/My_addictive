package bj.myaddictive.live.controller;

import bj.myaddictive.live.domain.Billet;
import bj.myaddictive.live.domain.CategorieBillet;
import bj.myaddictive.live.repository.BilletRepository;
import bj.myaddictive.live.service.LiveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Endpoint interne appele directement par paiement-service (resolu via
 * Eureka) apres confirmation d'un paiement de type BILLET ou FAN_CLUB.
 * Remplace l'ancien @RabbitListener.
 */
@RestController
@RequestMapping("/api/interne")
public class InterneController {

    private static final Logger log = LoggerFactory.getLogger(InterneController.class);
    private final BilletRepository billetRepository;
    private final LiveService liveService;

    public InterneController(BilletRepository billetRepository, LiveService liveService) {
        this.billetRepository = billetRepository;
        this.liveService = liveService;
    }

    @PostMapping("/paiement-confirme")
    @Transactional
    public ResponseEntity<Void> surPaiementConfirme(@RequestBody Map<String, Object> evenement) {
        String typeObjet = String.valueOf(evenement.get("typeObjet"));
        Long utilisateurId = Long.valueOf(String.valueOf(evenement.get("utilisateurId")));
        String referenceId = String.valueOf(evenement.get("referenceId"));

        if ("FAN_CLUB".equals(typeObjet)) {
            Long chaineId = Long.valueOf(referenceId);
            liveService.confirmerAbonnementFanClub(utilisateurId, chaineId);
            log.info("Fan club confirme/prolonge pour la chaine {} (utilisateur {}).", chaineId, utilisateurId);
            return ResponseEntity.ok().build();
        }

        // Sinon, il s'agit d'un achat de billet (referenceId encode "evenementId:categorie").
        Long transactionId = Long.valueOf(String.valueOf(evenement.get("transactionId")));
        if (billetRepository.existsByTransactionId(transactionId)) {
            log.info("Billet deja emis pour la transaction {}, appel ignore (idempotence).", transactionId);
            return ResponseEntity.ok().build();
        }

        String[] parts = referenceId.split(":");
        Long evenementId = Long.valueOf(parts[0]);
        String categorie = parts.length > 1 ? parts[1] : "STANDARD";

        Billet billet = new Billet();
        billet.setEvenementId(evenementId);
        billet.setUtilisateurId(utilisateurId);
        billet.setCategorie(CategorieBillet.valueOf(categorie));
        billet.setCodeQr("MYADD-BILLET-" + UUID.randomUUID());
        billet.setTransactionId(transactionId);
        billetRepository.save(billet);
        log.info("Billet emis pour l'evenement {} (utilisateur {}, transaction {}).", evenementId, utilisateurId, transactionId);
        return ResponseEntity.ok().build();
    }
}
