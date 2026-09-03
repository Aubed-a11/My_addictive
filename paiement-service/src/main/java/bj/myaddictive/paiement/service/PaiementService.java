package bj.myaddictive.paiement.service;

import bj.myaddictive.paiement.domain.MoyenPaiement;
import bj.myaddictive.paiement.domain.StatutTransaction;
import bj.myaddictive.paiement.domain.Transaction;
import bj.myaddictive.paiement.dto.InitierPaiementRequest;
import bj.myaddictive.paiement.dto.WebhookRequest;
import bj.myaddictive.paiement.exception.ApiException;
import bj.myaddictive.paiement.messaging.PaiementConfirmeNotifier;
import bj.myaddictive.paiement.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Coeur du socle de paiement (section 10 du CDC fonctionnel, section 21.4 du
 * CDC technique) : initie une transaction aupres de l'agregateur mobile
 * money/carte, puis attend sa confirmation, traitee de facon idempotente,
 * avant d'emettre quoi que ce soit (billet, titre, vote, commande) - jamais
 * l'inverse.
 *
 * Integration reelle MTN Mobile Money (MtnMomoClient) : des que les
 * identifiants marchand sont configures (voir DEPLOIEMENT.md), toute demande
 * de paiement MTN_MOMO passe par le vrai flux asynchrone MTN - invite PIN
 * envoyee sur le telephone du client, confirmation automatique reçue soit
 * par callback MTN (voir /webhooks/mtn-momo/{referenceId}), soit par
 * interrogation periodique de secours (voir PaiementRelanceScheduler) -
 * sans jamais nécessiter de validation manuelle.
 *
 * Mode simulation (developpement, ou moyens de paiement sans integration
 * reelle branchee pour l'instant - Moov Money, Celtiis Cash, carte bancaire) :
 * la transaction est auto-confirmee immediatement, pour permettre de tester
 * la chaine complete sans dependre d'un compte agregateur reel. Le paiement
 * en agence, lui, n'est JAMAIS auto-confirme, meme en simulation : voir
 * confirmerManuellement().
 */
@Service
public class PaiementService {

    private static final Logger log = LoggerFactory.getLogger(PaiementService.class);

    private final TransactionRepository transactionRepository;
    private final PaiementConfirmeNotifier notifier;
    private final MtnMomoClient mtnMomoClient;

    public PaiementService(TransactionRepository transactionRepository,
                            PaiementConfirmeNotifier notifier,
                            MtnMomoClient mtnMomoClient) {
        this.transactionRepository = transactionRepository;
        this.notifier = notifier;
        this.mtnMomoClient = mtnMomoClient;
    }

    @Transactional
    public Transaction initier(Long utilisateurId, InitierPaiementRequest requete) {
        if (requete.moyenPaiement() == MoyenPaiement.MTN_MOMO && mtnMomoClient.estConfigure()
                && (requete.telephonePayeur() == null || requete.telephonePayeur().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le numero de telephone Mobile Money est requis pour ce moyen de paiement.");
        }

        Transaction transaction = new Transaction();
        transaction.setUtilisateurId(utilisateurId);
        transaction.setMoyenPaiement(requete.moyenPaiement());
        transaction.setMontantFcfa(requete.montantFcfa());
        transaction.setTypeObjet(requete.typeObjet());
        transaction.setReferenceId(requete.referenceId());
        transaction.setStatut(StatutTransaction.EN_ATTENTE);
        transaction = transactionRepository.save(transaction);

        // Integration reelle MTN Mobile Money : demande de paiement envoyee
        // directement au telephone du client, statut confirme plus tard
        // (callback ou interrogation), jamais de maniere synchrone ici.
        if (requete.moyenPaiement() == MoyenPaiement.MTN_MOMO && mtnMomoClient.estConfigure()) {
            String referenceExterne = mtnMomoClient.demanderPaiement(
                    transaction.getMontantFcfa(), requete.telephonePayeur(),
                    "Paiement My Addictive #" + transaction.getId()
            );
            transaction.setIdTransactionExterne(referenceExterne);
            return transactionRepository.save(transaction);
        }

        // Paiement en agence (especes remises en main propre) : aucun agregateur
        // a interroger par nature, jamais de confirmation automatique, meme en
        // simulation - seule une confirmation manuelle explicite par un
        // administrateur peut faire passer cette transaction a REUSSI.
        if (requete.moyenPaiement() == MoyenPaiement.AGENCE) {
            transaction.setIdTransactionExterne("AGENCE-" + UUID.randomUUID());
            return transactionRepository.save(transaction);
        }

        // Simulation (developpement, ou moyen de paiement sans integration reelle
        // branchee pour l'instant) : confirmation immediate pour tester la chaine
        // complete sans dependre d'un compte agregateur reel.
        String idSimule = "SIM-" + UUID.randomUUID();
        transaction.setIdTransactionExterne(idSimule);
        transaction = transactionRepository.save(transaction);
        log.warn("[MODE SIMULATION] Aucune integration reelle branchee pour {} : confirmation automatique de la transaction {}",
                requete.moyenPaiement(), transaction.getId());
        traiterWebhook(transaction.getId(), new WebhookRequest(StatutTransaction.REUSSI, idSimule));
        return transactionRepository.findById(transaction.getId()).orElseThrow();
    }

    /**
     * Confirmation manuelle d'un paiement en agence, reservee aux administrateurs
     * (bouton dedie du dashboard) : a utiliser une fois l'espece effectivement
     * receptionnee et verifiee physiquement.
     */
    @Transactional
    public Transaction confirmerManuellement(Long transactionId) {
        Transaction transaction = obtenir(transactionId);
        if (transaction.getMoyenPaiement() != MoyenPaiement.AGENCE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Seuls les paiements en agence necessitent une confirmation manuelle.");
        }
        return traiterWebhook(transactionId, new WebhookRequest(StatutTransaction.REUSSI, transaction.getIdTransactionExterne()));
    }

    /**
     * Traite le callback de l'agregateur (ou l'interrogation periodique de
     * secours). Idempotent : un webhook rejoue pour une transaction deja
     * traitee ne republie pas l'evenement.
     */
    @Transactional
    public Transaction traiterWebhook(Long transactionId, WebhookRequest requete) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction introuvable."));

        if (transaction.getStatut() != StatutTransaction.EN_ATTENTE) {
            log.info("Webhook recu pour une transaction deja traitee ({}), ignore (idempotence).", transactionId);
            return transaction;
        }

        transaction.setStatut(requete.statut());
        transaction.setDateMaj(Instant.now());
        if (requete.idTransactionExterne() != null) {
            transaction.setIdTransactionExterne(requete.idTransactionExterne());
        }
        transaction = transactionRepository.save(transaction);

        if (transaction.getStatut() == StatutTransaction.REUSSI) {
            notifier.notifier(transaction);
        }
        return transaction;
    }

    /** Traite un callback MTN MoMo recu via son identifiant de reference externe (pas l'id interne). */
    @Transactional
    public Transaction traiterWebhookParReferenceExterne(String referenceExterne, StatutTransaction statut) {
        Transaction transaction = transactionRepository.findByIdTransactionExterne(referenceExterne)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction introuvable pour cette reference."));
        return traiterWebhook(transaction.getId(), new WebhookRequest(statut, referenceExterne));
    }

    public Transaction obtenir(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction introuvable."));
    }

    public List<Transaction> historique(Long utilisateurId) {
        return transactionRepository.findByUtilisateurIdOrderByDateCreationDesc(utilisateurId);
    }

    public List<Transaction> transactionsEnAttenteMtn() {
        return transactionRepository.findByStatutAndMoyenPaiement(StatutTransaction.EN_ATTENTE, MoyenPaiement.MTN_MOMO);
    }

    public List<Transaction> transactionsAgenceEnAttente() {
        return transactionRepository.findByStatutAndMoyenPaiement(StatutTransaction.EN_ATTENTE, MoyenPaiement.AGENCE);
    }

    public MtnMomoClient client() {
        return mtnMomoClient;
    }
}
