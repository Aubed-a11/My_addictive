package bj.myaddictive.paiement.service;

import bj.myaddictive.paiement.domain.StatutTransaction;
import bj.myaddictive.paiement.domain.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Filet de securite recommande par la documentation officielle MTN MoMo :
 * "implementing status polling ensures transaction completion even in cases
 * where the callback is missed". Interroge periodiquement le statut reel de
 * chaque transaction MTN Mobile Money encore EN_ATTENTE, au cas ou le
 * callback n'aurait pas ete recu (reseau, domaine mal configure...) - c'est
 * ce mecanisme qui garantit qu'une transaction ne reste jamais bloquee
 * indefiniment sans intervention manuelle, sans jamais avoir besoin de
 * validation manuelle non plus.
 */
@Component
public class PaiementRelanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(PaiementRelanceScheduler.class);

    private final PaiementService paiementService;

    public PaiementRelanceScheduler(PaiementService paiementService) {
        this.paiementService = paiementService;
    }

    @Scheduled(fixedDelay = 15_000) // toutes les 15 secondes : un paiement mobile money se confirme generalement en quelques dizaines de secondes
    public void relancerTransactionsEnAttente() {
        if (!paiementService.client().estConfigure()) return; // rien a interroger si l'integration reelle n'est pas active

        List<Transaction> enAttente = paiementService.transactionsEnAttenteMtn();
        for (Transaction transaction : enAttente) {
            try {
                String statutMtn = paiementService.client().obtenirStatut(transaction.getIdTransactionExterne());
                StatutTransaction statut = switch (statutMtn) {
                    case "SUCCESSFUL" -> StatutTransaction.REUSSI;
                    case "FAILED" -> StatutTransaction.ECHEC;
                    default -> null; // encore PENDING : rien a faire, on reessaiera au prochain passage
                };
                if (statut != null) {
                    log.info("Interrogation periodique : transaction {} passee a {} (callback probablement manque).", transaction.getId(), statut);
                    paiementService.traiterWebhookParReferenceExterne(transaction.getIdTransactionExterne(), statut);
                }
            } catch (Exception e) {
                // Une erreur d'interrogation pour une transaction ne doit jamais bloquer les autres.
                log.warn("Erreur lors de l'interrogation du statut de la transaction {} : {}", transaction.getId(), e.getMessage());
            }
        }
    }
}
