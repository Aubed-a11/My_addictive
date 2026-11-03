package bj.myaddictive.paiement.service;

import bj.myaddictive.paiement.domain.MoyenPaiement;
import bj.myaddictive.paiement.domain.StatutTransaction;
import bj.myaddictive.paiement.domain.Transaction;
import bj.myaddictive.paiement.domain.TypeObjetPaiement;
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
    private final KkiapayClient kkiapayClient;
    private final boolean simulationAutorisee;
    private final String kkiapaySecret;

    public PaiementService(TransactionRepository transactionRepository,
                            PaiementConfirmeNotifier notifier,
                            MtnMomoClient mtnMomoClient,
                            KkiapayClient kkiapayClient,
                            // Secret du webhook defini dans le dashboard KKiaPay ("hash secret") ;
                            // a defaut, on reprend la cle secrete API (comportement historique).
                            @org.springframework.beans.factory.annotation.Value("${mobile-money.kkiapay.webhook-secret:}") String kkiapayWebhookSecret,
                            @org.springframework.beans.factory.annotation.Value("${mobile-money.kkiapay.secret-key:}") String kkiapaySecretApi,
                            @org.springframework.beans.factory.annotation.Value("${paiement.simulation-autorisee:false}") boolean simulationAutorisee) {
        this.simulationAutorisee = simulationAutorisee;
        this.transactionRepository = transactionRepository;
        this.notifier = notifier;
        this.mtnMomoClient = mtnMomoClient;
        this.kkiapayClient = kkiapayClient;
        this.kkiapaySecret = kkiapayWebhookSecret.isBlank() ? kkiapaySecretApi : kkiapayWebhookSecret;
    }

    @Transactional
    public Transaction initier(Long utilisateurId, InitierPaiementRequest requete) {
        if (requete.moyenPaiement() == MoyenPaiement.MTN_MOMO && mtnMomoClient.estConfigure()
                && (requete.telephonePayeur() == null || requete.telephonePayeur().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le numero de telephone Mobile Money est requis pour ce moyen de paiement.");
        }

        // Moyens sans integration reelle (Moov, Celtiis, carte directe, MTN non configure) :
        // ils se "confirmaient" automatiquement, donc un achat gratuit. Refuses sauf si la
        // simulation est explicitement activee (PAIEMENT_SIMULATION=true, developpement local).
        boolean moyenReel = requete.moyenPaiement() == MoyenPaiement.KKIAPAY
                || requete.moyenPaiement() == MoyenPaiement.AGENCE
                || (requete.moyenPaiement() == MoyenPaiement.MTN_MOMO && mtnMomoClient.estConfigure());
        if (!moyenReel && !simulationAutorisee) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Ce moyen de paiement n'est pas encore disponible. Choisissez \"Mobile Money / Carte (KKiaPay)\".");
        }

        if (requete.moyenPaiement() == MoyenPaiement.KKIAPAY) {
            // Double clic ou nouvelle tentative apres fermeture du widget : on reutilise la transaction
            // encore vierge (pas liee a KKiaPay) plutot que d'en creer une nouvelle a chaque fois.
            var existante = transactionRepository
                    .findFirstByUtilisateurIdAndMoyenPaiementAndTypeObjetAndReferenceIdAndStatutAndIdTransactionExterneIsNullAndDateCreationAfterOrderByDateCreationDesc(
                            utilisateurId, MoyenPaiement.KKIAPAY, requete.typeObjet(), requete.referenceId(),
                            StatutTransaction.EN_ATTENTE, Instant.now().minusSeconds(600));
            if (existante.isPresent() && existante.get().getMontantFcfa().equals(requete.montantFcfa())) {
                return existante.get();
            }
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
        transaction = transactionRepository.save(transaction);
        // Verification serveur immediate aupres de KKiaPay : rattrape un webhook
        // arrive AVANT cette liaison (ignore a l'epoque) ou jamais configure.
        return verifierAupresDeKkiapay(transaction);
    }

    /**
     * Interroge KKiaPay (cote serveur, avec nos cles privees) sur une transaction
     * KKiaPay EN_ATTENTE deja liee, et la confirme / la rejette selon sa reponse.
     * Un montant different de celui attendu n'est JAMAIS confirme.
     */
    @Transactional
    public Transaction verifierAupresDeKkiapay(Transaction transaction) {
        if (transaction.getMoyenPaiement() != MoyenPaiement.KKIAPAY
                || transaction.getStatut() != StatutTransaction.EN_ATTENTE
                || transaction.getIdTransactionExterne() == null
                || !kkiapayClient.estConfigure()) {
            return transaction;
        }
        var verification = kkiapayClient.verifier(transaction.getIdTransactionExterne());
        if (verification.isEmpty()) return transaction;
        var v = verification.get();
        if (v.statut() == StatutTransaction.REUSSI && v.montantFcfa() != null
                && !v.montantFcfa().equals(transaction.getMontantFcfa())) {
            log.error("Montant KKiaPay ({}) different du montant attendu ({}) pour la transaction {} : NON confirmee.",
                    v.montantFcfa(), transaction.getMontantFcfa(), transaction.getId());
            return transaction;
        }
        return traiterWebhook(transaction.getId(), new WebhookRequest(v.statut(), transaction.getIdTransactionExterne()));
    }

    public List<Transaction> transactionsKkiapayEnAttente() {
        return transactionRepository.findByStatutAndMoyenPaiement(StatutTransaction.EN_ATTENTE, MoyenPaiement.KKIAPAY);
    }

    /**
     * Libere les transactions KKiaPay abandonnees (widget ferme avant tout paiement,
     * donc jamais liees) apres 30 min : passe en ECHEC et previent le service metier,
     * ce qui restitue notamment le stock reserve par une commande boutique.
     */
    @Transactional
    public void expirerAbandonnees() {
        Instant limite = Instant.now().minusSeconds(30 * 60);
        for (Transaction t : transactionsKkiapayEnAttente()) {
            if (t.getIdTransactionExterne() == null && t.getDateCreation().isBefore(limite)) {
                log.info("Transaction KKiaPay {} abandonnee (non liee apres 30 min) : passee en ECHEC.", t.getId());
                traiterWebhook(t.getId(), new WebhookRequest(StatutTransaction.ECHEC, null));
            }
        }
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
        Transaction transaction = transactionRepository.findByIdForUpdate(transactionId)
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
        if (transaction.getStatut() == StatutTransaction.ECHEC && transaction.getTypeObjet() == TypeObjetPaiement.COMMANDE) {
            // Seule la boutique doit etre prevenue d'un echec (restitution du stock reserve) :
            // la notification est renvoyee tant qu'elle n'est pas recue.
            transaction.setNotificationEnAttente(true);
        }
        if (transaction.getStatut() == StatutTransaction.REUSSI) {
            // Reste "en attente de notification" tant que le service metier n'a pas confirme
            // (voir relancerNotifications) : un redemarrage ne fait plus perdre un billet/titre paye.
            transaction.setNotificationEnAttente(true);
        }
        transaction = transactionRepository.save(transaction);

        if (transaction.getStatut() == StatutTransaction.REUSSI) {
            if (notifier.notifier(transaction)) {
                transaction.setNotificationEnAttente(false);
                transaction = transactionRepository.save(transaction);
            }
        } else if (transaction.getStatut() == StatutTransaction.ECHEC) {
            // Necessaire notamment pour boutique-service, qui reserve le stock des
            // l'initiation de la commande (voir BoutiqueService.initierCommande) :
            // sans cette notification, un stock reserve pour une commande finalement
            // non payee resterait indisponible indefiniment.
            if (transaction.getTypeObjet() == TypeObjetPaiement.COMMANDE) {
                if (notifier.notifierEchec(transaction)) {
                    transaction.setNotificationEnAttente(false);
                    transaction = transactionRepository.save(transaction);
                }
            } else {
                notifier.notifierEchec(transaction);
            }
        }
        return transaction;
    }

    /**
     * Renvoie les notifications de paiement reussi que le service metier n'a pas
     * pu recevoir (indisponible, en cours de redemarrage...). Appelee periodiquement.
     */
    public List<Long> notificationsEnAttente() {
        return transactionRepository.findByNotificationEnAttenteTrue().stream().map(Transaction::getId).toList();
    }

    @Transactional
    public void relancerNotification(Long transactionId) {
        transactionRepository.findByIdForUpdate(transactionId).ifPresent(t -> {
            if (!Boolean.TRUE.equals(t.getNotificationEnAttente())) return;
            boolean envoye;
            if (t.getStatut() == StatutTransaction.REUSSI) envoye = notifier.notifier(t);
            else if (t.getStatut() == StatutTransaction.ECHEC) envoye = notifier.notifierEchec(t);
            else return;
            if (envoye) {
                t.setNotificationEnAttente(false);
                transactionRepository.save(t);
                log.info("Notification de la transaction {} renvoyee avec succes.", t.getId());
            }
        });
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
            if (transactionRepository.findByIdTransactionExterne(transactionIdExterne).isEmpty()) {
                // Pas encore liee : KKiaPay renvoie le partnerId (= notre id de transaction, passe a l'ouverture du widget).
                Object partnerId = corps.get("partnerId");
                if (partnerId != null && String.valueOf(partnerId).matches("\\d+")) {
                    transactionRepository.findById(Long.valueOf(String.valueOf(partnerId)))
                            .filter(t -> t.getMoyenPaiement() == MoyenPaiement.KKIAPAY && t.getStatut() == StatutTransaction.EN_ATTENTE)
                            .ifPresent(t -> {
                                t.setIdTransactionExterne(transactionIdExterne);
                                transactionRepository.save(t);
                            });
                }
            }
            Object montantRecu = corps.get("amount");
            if (succes && montantRecu instanceof Number n) {
                var t = transactionRepository.findByIdTransactionExterne(transactionIdExterne);
                if (t.isPresent() && t.get().getMontantFcfa() != n.longValue()) {
                    log.error("Webhook KKiaPay : montant {} different du montant attendu {} (transaction {}), NON confirmee.",
                            n, t.get().getMontantFcfa(), t.get().getId());
                    return;
                }
            }
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
