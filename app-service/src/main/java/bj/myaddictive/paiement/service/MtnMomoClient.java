package bj.myaddictive.paiement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

/**
 * Client reel de l'API MTN Mobile Money Collections (Request to Pay),
 * suivant exactement le contrat documente par MTN (momodeveloper.mtn.com) :
 *
 *  1. POST /collection/token/                     -> jeton OAuth (valable 1h)
 *  2. POST /collection/v1_0/requesttopay           -> declenche l'invite de
 *     paiement sur le telephone du client (reponse 202, traitement asynchrone)
 *  3. GET  /collection/v1_0/requesttopay/{id}      -> statut final (PENDING,
 *     SUCCESSFUL, FAILED), a la fois utilisable en interrogation periodique
 *     ET refletant exactement la forme du callback envoye par MTN.
 *
 * Necessite un compte marchand MTN MoMo reel (cles obtenues apres inscription
 * et validation KYC sur momodeveloper.mtn.com, distinctes entre le
 * bac a sable de test et l'environnement de production Benin) : voir
 * DEPLOIEMENT.md pour la procedure complete d'obtention de ces identifiants.
 * Tant qu'ils ne sont pas renseignes, ce client n'est jamais sollicite
 * (PaiementService reste alors en mode simulation).
 */
@Component
public class MtnMomoClient {

    private static final Logger log = LoggerFactory.getLogger(MtnMomoClient.class);

    private final String baseUrl;
    private final String subscriptionKey;
    private final String apiUser;
    private final String apiKey;
    private final String environnementCible;
    private final String callbackHost;
    private final WebClient webClient;

    private volatile String jetonCourant;
    private volatile Instant expirationJeton = Instant.EPOCH;

    public MtnMomoClient(
            @Value("${mobile-money.mtn.base-url:https://sandbox.momodeveloper.mtn.com}") String baseUrl,
            @Value("${mobile-money.mtn.subscription-key:}") String subscriptionKey,
            @Value("${mobile-money.mtn.api-user:}") String apiUser,
            @Value("${mobile-money.mtn.api-key:}") String apiKey,
            @Value("${mobile-money.mtn.target-environment:sandbox}") String environnementCible,
            @Value("${mobile-money.mtn.callback-host:}") String callbackHost
    ) {
        this.baseUrl = baseUrl;
        this.subscriptionKey = subscriptionKey;
        this.apiUser = apiUser;
        this.apiKey = apiKey;
        this.environnementCible = environnementCible;
        this.callbackHost = callbackHost;
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    /** true seulement si les trois identifiants necessaires ont ete configures (voir application.yml / variables d'environnement). */
    public boolean estConfigure() {
        return !subscriptionKey.isBlank() && !apiUser.isBlank() && !apiKey.isBlank();
    }

    private synchronized String obtenirJeton() {
        if (jetonCourant != null && Instant.now().isBefore(expirationJeton)) {
            return jetonCourant;
        }
        String authBasic = Base64.getEncoder().encodeToString((apiUser + ":" + apiKey).getBytes());
        Map<String, Object> reponse = webClient.post()
                .uri("/collection/token/")
                .header("Authorization", "Basic " + authBasic)
                .header("Ocp-Apim-Subscription-Key", subscriptionKey)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        jetonCourant = String.valueOf(reponse.get("access_token"));
        long dureeSecondes = reponse.get("expires_in") != null ? Long.parseLong(String.valueOf(reponse.get("expires_in"))) : 3600;
        // Marge de securite de 60 secondes avant l'expiration reelle, pour ne jamais utiliser un jeton perime de justesse.
        expirationJeton = Instant.now().plusSeconds(Math.max(60, dureeSecondes - 60));
        return jetonCourant;
    }

    /**
     * Declenche une demande de paiement (invite PIN sur le telephone du client).
     * Retourne l'identifiant de reference (genere ici) permettant de suivre le
     * statut ensuite, via getStatut() ou le callback MTN.
     */
    public String demanderPaiement(long montantFcfa, String telephoneMsisdn, String note) {
        String referenceId = UUID.randomUUID().toString();
        Map<String, Object> corps = Map.of(
                "amount", String.valueOf(montantFcfa),
                "currency", "XOF",
                "externalId", referenceId,
                "payer", Map.of("partyIdType", "MSISDN", "partyId", telephoneMsisdn),
                "payerMessage", note,
                "payeeNote", note
        );
        webClient.post()
                .uri("/collection/v1_0/requesttopay")
                .header("Authorization", "Bearer " + obtenirJeton())
                .header("Ocp-Apim-Subscription-Key", subscriptionKey)
                .header("X-Reference-Id", referenceId)
                .header("X-Target-Environment", environnementCible)
                .header("X-Callback-Url", callbackHost + "/api/paiement/webhooks/mtn-momo/" + referenceId)
                .bodyValue(corps)
                .retrieve()
                .toBodilessEntity()
                .block();
        log.info("Demande de paiement MTN MoMo initiee, reference {}", referenceId);
        return referenceId;
    }

    /**
     * Interroge le statut reel aupres de MTN. A utiliser en filet de securite
     * periodique (voir PaiementRelanceScheduler) en complement du callback,
     * conformement a la recommandation officielle MTN ("implementing status
     * polling ensures transaction completion even in cases where the callback
     * is missed").
     */
    public String obtenirStatut(String referenceId) {
        Map<String, Object> reponse = webClient.get()
                .uri("/collection/v1_0/requesttopay/{id}", referenceId)
                .header("Authorization", "Bearer " + obtenirJeton())
                .header("Ocp-Apim-Subscription-Key", subscriptionKey)
                .header("X-Target-Environment", environnementCible)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        return String.valueOf(reponse.get("status")); // PENDING | SUCCESSFUL | FAILED
    }
}
