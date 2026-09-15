package bj.myaddictive.boutique.controller;

import bj.myaddictive.boutique.domain.Commande;
import bj.myaddictive.boutique.domain.LigneCommande;
import bj.myaddictive.boutique.domain.StatutCommande;
import bj.myaddictive.boutique.repository.CommandeRepository;
import bj.myaddictive.boutique.repository.LigneCommandeRepository;
import bj.myaddictive.boutique.repository.ProduitRepository;
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
 * Eureka) apres confirmation d'un paiement de type COMMANDE. Remplace
 * l'ancien @RabbitListener : concretise toujours "un paiement echoue
 * n'emet aucune commande" (section 8.2), et reste idempotent.
 */
@RestController
@RequestMapping("/api/interne")
public class InterneController {

    private static final Logger log = LoggerFactory.getLogger(InterneController.class);

    private final CommandeRepository commandeRepository;
    private final LigneCommandeRepository ligneCommandeRepository;
    private final ProduitRepository produitRepository;

    public InterneController(CommandeRepository commandeRepository, LigneCommandeRepository ligneCommandeRepository,
                              ProduitRepository produitRepository) {
        this.commandeRepository = commandeRepository;
        this.ligneCommandeRepository = ligneCommandeRepository;
        this.produitRepository = produitRepository;
    }

    @PostMapping("/paiement-confirme")
    @Transactional
    public ResponseEntity<Void> surPaiementConfirme(@RequestBody Map<String, Object> evenement) {
        Long transactionId = Long.valueOf(String.valueOf(evenement.get("transactionId")));
        Long commandeId = Long.valueOf(String.valueOf(evenement.get("referenceId")));

        Commande commande = commandeRepository.findById(commandeId).orElse(null);
        if (commande == null) {
            log.warn("Commande {} introuvable pour la transaction {}.", commandeId, transactionId);
            return ResponseEntity.ok().build();
        }
        if (commande.getStatut() != StatutCommande.EN_ATTENTE) {
            log.info("Commande {} deja traitee, appel ignore (idempotence).", commandeId);
            return ResponseEntity.ok().build();
        }

        commande.setStatut(StatutCommande.PAYEE);
        commande.setTransactionId(transactionId);
        commandeRepository.save(commande);

        // Le stock a deja ete decompte atomiquement des l'initiation de la commande
        // (voir BoutiqueService.initierCommande), pas ici : le decompter une seconde
        // fois a la confirmation créerait un double decompte pour chaque commande.
        log.info("Commande {} confirmee (transaction {}).", commandeId, transactionId);
        return ResponseEntity.ok().build();
    }

    /**
     * Restaure le stock reserve si le paiement echoue finalement (annule
     * par l'utilisateur, refuse par l'agregateur, expire...) : sans ce
     * mecanisme, un stock reserve a l'initiation resterait indisponible
     * indefiniment meme si la commande n'a jamais ete reglee.
     */
    @PostMapping("/paiement-echoue")
    @Transactional
    public ResponseEntity<Void> surPaiementEchoue(@RequestBody Map<String, Object> evenement) {
        Long transactionId = Long.valueOf(String.valueOf(evenement.get("transactionId")));
        Long commandeId = Long.valueOf(String.valueOf(evenement.get("referenceId")));

        Commande commande = commandeRepository.findById(commandeId).orElse(null);
        if (commande == null) {
            log.warn("Commande {} introuvable pour la transaction echouee {}.", commandeId, transactionId);
            return ResponseEntity.ok().build();
        }
        if (commande.getStatut() != StatutCommande.EN_ATTENTE) {
            log.info("Commande {} deja traitee, echec ignore (idempotence).", commandeId);
            return ResponseEntity.ok().build();
        }

        commande.setStatut(StatutCommande.ECHOUEE);
        commande.setTransactionId(transactionId);
        commandeRepository.save(commande);

        for (LigneCommande ligne : ligneCommandeRepository.findByCommandeId(commandeId)) {
            produitRepository.restaurerStock(ligne.getProduitId(), ligne.getQuantite());
        }
        log.info("Commande {} marquee echouee, stock restaure (transaction {}).", commandeId, transactionId);
        return ResponseEntity.ok().build();
    }
}
