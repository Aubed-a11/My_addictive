package bj.myaddictive.paiement.service;

import bj.myaddictive.paiement.domain.StatutTransaction;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

/**
 * Verification serveur d'une transaction KKiaPay (filet de securite en plus
 * du webhook). Contrat repris du SDK officiel @kkiapay-org/nodejs-sdk :
 *   POST {https://api.kkiapay.me | https://api-sandbox.kkiapay.me}/api/v1/transactions/status
 *   en-tetes x-api-key (cle publique), x-private-key, x-secret-key
 *   corps { "transactionId": "..." } -> { "status": "SUCCESS|FAILED|PENDING...", "amount": 40, ... }
 *
 * Sans les trois cles, estConfigure() est faux et le service continue de
 * dependre uniquement du webhook (comportement historique).
 */
@Component
public class KkiapayClient {

    private static final Logger log = LoggerFactory.getLogger(KkiapayClient.class);

    public record Verification(StatutTransaction statut, Long montantFcfa) {}

    private final String clePublique;
    private final String clePrivee;
    private final String cleSecrete;
    private final WebClient webClient;

    public KkiapayClient(
            @Value("${mobile-money.kkiapay.public-key:}") String clePublique,
            @Value("${mobile-money.kkiapay.private-key:}") String clePrivee,
            @Value("${mobile-money.kkiapay.secret-key:}") String cleSecrete,
            @Value("${mobile-money.kkiapay.sandbox:true}") boolean sandbox) {
        this.clePublique = clePublique;
        this.clePrivee = clePrivee;
        this.cleSecrete = cleSecrete;
        // Client NON charge-equilibre (l'hote est externe, pas un service Eureka).
        this.webClient = WebClient.builder()
                .baseUrl(sandbox ? "https://api-sandbox.kkiapay.me" : "https://api.kkiapay.me")
                .build();
    }

    public boolean estConfigure() {
        return !clePublique.isBlank() && !clePrivee.isBlank() && !cleSecrete.isBlank();
    }

    /** Retourne le statut reel chez KKiaPay, ou vide si inconnu / encore en cours / erreur reseau. */
    public Optional<Verification> verifier(String transactionIdExterne) {
        if (!estConfigure() || transactionIdExterne == null || transactionIdExterne.isBlank()) return Optional.empty();
        try {
            JsonNode reponse = webClient.post().uri("/api/v1/transactions/status")
                    .header("x-api-key", clePublique)
                    .header("x-private-key", clePrivee)
                    .header("x-secret-key", cleSecrete)
                    .bodyValue(Map.of("transactionId", transactionIdExterne))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(Duration.ofSeconds(10));
            if (reponse == null) return Optional.empty();
            String statut = reponse.path("status").asText("").toUpperCase();
            Long montant = reponse.hasNonNull("amount") ? reponse.get("amount").asLong() : null;
            log.info("Verification KKiaPay {} -> {} ({} FCFA)", transactionIdExterne, statut, montant);
            return switch (statut) {
                case "SUCCESS", "SUCCESSFUL" -> Optional.of(new Verification(StatutTransaction.REUSSI, montant));
                case "FAILED", "FAILURE" -> Optional.of(new Verification(StatutTransaction.ECHEC, montant));
                default -> Optional.empty(); // PENDING ou valeur inconnue : on reessaiera
            };
        } catch (Exception e) {
            log.warn("Verification KKiaPay impossible pour {} : {}", transactionIdExterne, e.getMessage());
            return Optional.empty();
        }
    }
}
