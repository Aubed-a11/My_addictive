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
    private final String kkiapaySecret;

    public PaiementService(TransactionRepository transactionRepository,
                            PaiementConfirmeNotifier notifier,
                            MtnMomoClient mtnMomoClient,
                            @org.springframework.beans.factory.annotation.Value("${mobile-money.kkiapay.secret-key:}") String kkiapaySecret) {
        this.transactionRepository = transactionRepository;
        this.notifier = notifier;
        this.mtnMomoClient = mtnMomoClient;
        this.kkiapaySecret = kkiapaySecret;
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

        // KKiaPay (mobile money, carte bancaire et autres, en une seule
        // integration) : contrairement a MTN Mobile Money, c'est ici l'application
        // cliente elle-meme (widget KKiaPay) qui gere directement l'interaction
        // avec l'utilisateur - le serveur n'a rien a appeler a ce stade. La
        // transaction reste EN_ATTENTE jusqu'a ce que l'app rapporte l'identifiant
        // KKiaPay obtenu (voir lierTransactionExterne), confirme ensuite par le
        // webhook KKiaPay (jamais par le seul retour du widget cote client, pour
        // eviter toute fraude - voir KkiapayWebhookController).
        if (requete.moyenPaiement() == MoyenPaiement.KKIAPAY) {
            return transaction;
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
     * Associe l'identifiant de transaction KKiaPay (obtenu par l'app cliente
     * une fois le widget termine avec succes cote client) a la transaction
     * interne correspondante, pour que le webhook KKiaPay - qui ne connait
     * que cet identifiant externe - puisse la retrouver ensuite. Ne change
     * jamais le statut a lui seul : seul le webhook (ou une interrogation
     * serveur) confirme reellement le paiement.
     */
    @Transactional
    public Transaction lierTransactionExterne(Long utilisateurId, Long transactionId, String idTransactionExterne) {
        Transaction transaction = obtenir(transactionId);
        if (!transaction.getUtilisateurId().equals(utilisateurId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette transaction ne vous appartient pas.");
        }
        if (transaction.getStatut() != StatutTransaction.EN_ATTENTE) {
            return transaction; // deja traitee, rien a faire (idempotence)
        }
        transaction.setIdTransactionExterne(idTransactionExterne);
        return transactionRepository.save(transaction);
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
        } else if (transaction.getStatut() == StatutTransaction.ECHEC) {
            // Necessaire notamment pour boutique-service, qui reserve le stock des
            // l'initiation de la commande (voir BoutiqueService.initierCommande) :
            // sans cette notification, un stock reserve pour une commande finalement
            // non payee resterait indisponible indefiniment.
            notifier.notifierEchec(transaction);
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

    /**
     * Traite le webhook KKiaPay (format confirme par leur documentation) :
     * { "transactionId": "...", "isPaymentSucces": true|false, ... }.
     * Verifie d'abord que l'en-tete x-kkiapay-secret correspond bien a la
     * cle secrete configuree, pour empecher quiconque de forger un faux
     * succes de paiement en appelant directement cette URL sans jamais
     * etre passe par KKiaPay.
     */
    @Transactional
    public void traiterWebhookKkiapay(String secretRecu, java.util.Map<String, Object> corps) {
        if (kkiapaySecret.isBlank()) {
            log.warn("Webhook KKiaPay recu mais aucune cle secrete n'est configuree (mobile-money.kkiapay.secret-key) : ignore par securite.");
            return;
        }
        if (!kkiapaySecret.equals(secretRecu)) {
            log.warn("Webhook KKiaPay recu avec une signature invalide, ignore.");
            return;
        }
        String transactionIdExterne = String.valueOf(corps.get("transactionId"));
        boolean succes = Boolean.TRUE.equals(corps.get("isPaymentSucces"));
        try {
            traiterWebhookParReferenceExterne(transactionIdExterne, succes ? StatutTransaction.REUSSI : StatutTransaction.ECHEC);
        } catch (ApiException e) {
            // Transaction pas encore liee cote serveur (voir lierTransactionExterne)
            // au moment ou le webhook arrive : peut arriver si KKiaPay notifie tres
            // vite. Sans file d'attente de retraitement, le cas se rattrape via
            // l'appel a lierTransactionExterne qui, cote app, revient verifier le
            // statut juste apres.
            log.warn("Webhook KKiaPay recu pour une transaction externe {} non trouvee (pas encore liee ?).", transactionIdExterne);
        }
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
