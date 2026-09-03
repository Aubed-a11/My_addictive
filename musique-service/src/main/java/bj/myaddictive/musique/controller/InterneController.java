package bj.myaddictive.musique.controller;

import bj.myaddictive.musique.domain.Achat;
import bj.myaddictive.musique.repository.AchatRepository;
import bj.myaddictive.musique.repository.TitreRepository;
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
 * Eureka) apres confirmation d'un paiement de type TITRE/ALBUM. Remplace
 * l'ancien @RabbitListener : meme regle de gestion (aucun titre debloque
 * avant cet appel) et meme idempotence (verifie que la transaction n'a pas
 * deja ete traitee). Non expose publiquement via la gateway.
 */
@RestController
@RequestMapping("/api/interne")
public class InterneController {

    private static final Logger log = LoggerFactory.getLogger(InterneController.class);

    private final AchatRepository achatRepository;
    private final TitreRepository titreRepository;

    public InterneController(AchatRepository achatRepository, TitreRepository titreRepository) {
        this.achatRepository = achatRepository;
        this.titreRepository = titreRepository;
    }

    @PostMapping("/paiement-confirme")
    @Transactional
    public ResponseEntity<Void> surPaiementConfirme(@RequestBody Map<String, Object> evenement) {
        Long transactionId = Long.valueOf(String.valueOf(evenement.get("transactionId")));
        if (achatRepository.existsByTransactionId(transactionId)) {
            log.info("Achat deja cree pour la transaction {}, appel ignore (idempotence).", transactionId);
            return ResponseEntity.ok().build();
        }

        Long utilisateurId = Long.valueOf(String.valueOf(evenement.get("utilisateurId")));
        Long titreId = Long.valueOf(String.valueOf(evenement.get("referenceId")));

        Achat achat = new Achat();
        achat.setUtilisateurId(utilisateurId);
        achat.setTitreId(titreId);
        achat.setTransactionId(transactionId);
        achatRepository.save(achat);

        titreRepository.findById(titreId).ifPresent(titre -> {
            titre.setCompteurTelechargements(titre.getCompteurTelechargements() + 1);
            titreRepository.save(titre);
        });
        log.info("Titre {} debloque pour l'utilisateur {} (transaction {}).", titreId, utilisateurId, transactionId);
        return ResponseEntity.ok().build();
    }
}
