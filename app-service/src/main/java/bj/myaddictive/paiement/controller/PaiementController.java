package bj.myaddictive.paiement.controller;

import bj.myaddictive.paiement.domain.StatutTransaction;
import bj.myaddictive.paiement.domain.Transaction;
import bj.myaddictive.paiement.dto.InitierPaiementRequest;
import bj.myaddictive.paiement.dto.WebhookRequest;
import bj.myaddictive.paiement.exception.ApiException;
import bj.myaddictive.paiement.service.PaiementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paiement")
public class PaiementController {

    private final PaiementService paiementService;

    public PaiementController(PaiementService paiementService) {
        this.paiementService = paiementService;
    }

    @PostMapping("/transactions")
    public ResponseEntity<Transaction> initier(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody InitierPaiementRequest requete) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(paiementService.initier(Long.valueOf(userId), requete));
    }

    /** Recoit les callbacks de l'agregateur mobile money / carte bancaire. */
    @PostMapping("/webhook/{transactionId}")
    public ResponseEntity<Transaction> webhook(@PathVariable Long transactionId, @RequestBody WebhookRequest requete) {
        return ResponseEntity.ok(paiementService.traiterWebhook(transactionId, requete));
    }

    /**
     * Callback reel de l'API MTN Mobile Money Collections (Request to Pay) :
     * MTN appelle cette URL (enregistree comme X-Callback-Url a l'initiation
     * de la demande) une fois le paiement traite, avec un corps de la meme
     * forme que la reponse de l'endpoint de statut : { "status": "SUCCESSFUL"
     * | "FAILED" | "PENDING", ... }. Route volontairement publique (pas de
     * jeton applicatif : MTN n'en fournit pas), identifiee uniquement par la
     * reference externe generee lors de la demande.
     */
    @PostMapping("/webhooks/mtn-momo/{referenceId}")
    public ResponseEntity<Void> webhookMtnMomo(@PathVariable String referenceId, @RequestBody Map<String, Object> corps) {
        String statutMtn = String.valueOf(corps.get("status"));
        StatutTransaction statut = switch (statutMtn) {
            case "SUCCESSFUL" -> StatutTransaction.REUSSI;
            case "FAILED" -> StatutTransaction.ECHEC;
            default -> null; // PENDING ou valeur inattendue : rien a faire, on attend le prochain callback ou l'interrogation periodique
        };
        if (statut != null) {
            paiementService.traiterWebhookParReferenceExterne(referenceId, statut);
        }
        return ResponseEntity.ok().build();
    }

    /**
     * Confirmation manuelle d'un paiement en agence (especes remises en main
     * propre), reservee aux administrateurs : le seul moyen de paiement qui ne
     * peut jamais etre confirme automatiquement, meme en environnement de
     * developpement, puisqu'il n'existe par nature aucun agregateur a interroger.
     */
    @PostMapping("/transactions/{id}/confirmer-agence")
    public ResponseEntity<Transaction> confirmerAgence(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
        return ResponseEntity.ok(paiementService.confirmerManuellement(id));
    }

    /**
     * Associe l'identifiant de transaction KKiaPay a la transaction interne
     * correspondante, une fois le widget termine avec succes cote client
     * (voir PaiementService.lierTransactionExterne : ne confirme jamais le
     * paiement a lui seul, seul le webhook KKiaPay fait foi).
     */
    @PostMapping("/transactions/{id}/lier-externe")
    public ResponseEntity<Transaction> lierExterne(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long id, @RequestBody Map<String, String> corps) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(paiementService.lierTransactionExterne(Long.valueOf(userId), id, corps.get("idTransactionExterne")));
    }

    /**
     * Webhook KKiaPay (mobile money, carte bancaire et autres en une seule
     * integration - voir DEPLOIEMENT.md pour la procedure d'obtention des
     * cles et de configuration du webhook sur le dashboard KKiaPay). Verifie
     * l'en-tete x-kkiapay-secret avant tout traitement : sans cette
     * verification, n'importe qui pourrait forger un faux succes de
     * paiement en appelant directement cette URL.
     */
    @PostMapping("/webhooks/kkiapay")
    public ResponseEntity<Void> webhookKkiapay(
            @RequestHeader(value = "x-kkiapay-secret", required = false) String secretRecu,
            @RequestBody Map<String, Object> corps) {
        paiementService.traiterWebhookKkiapay(secretRecu, corps);
        return ResponseEntity.ok().build();
    }

    /** Verification d'un identifiant de transaction depuis Mon compte (section 9.1). */
    @GetMapping("/transactions/{id}")
    public ResponseEntity<Transaction> obtenir(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        Transaction transaction = paiementService.obtenir(id);
        boolean estProprietaire = transaction.getUtilisateurId().equals(Long.valueOf(userId));
        boolean estAdmin = "ADMINISTRATEUR".equals(role);
        if (!estProprietaire && !estAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette transaction n'appartient pas a votre compte.");
        }
        return ResponseEntity.ok(transaction);
    }

    /** Liste des paiements en agence en attente de verification, pour le dashboard admin. */
    @GetMapping("/transactions/admin/agence-en-attente")
    public ResponseEntity<List<Transaction>> agenceEnAttente(@RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
        return ResponseEntity.ok(paiementService.transactionsAgenceEnAttente());
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Transaction>> historique(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(paiementService.historique(Long.valueOf(userId)));
    }
}
