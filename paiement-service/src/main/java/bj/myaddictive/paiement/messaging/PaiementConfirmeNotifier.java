package bj.myaddictive.paiement.messaging;

import bj.myaddictive.paiement.domain.Transaction;
import bj.myaddictive.paiement.domain.TypeObjetPaiement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * Notifie le microservice metier concerne apres confirmation d'un paiement.
 *
 * Historiquement ce pont passait par un evenement RabbitMQ
 * (paiement.confirme.*) ; en l'absence d'un broker de message installe en
 * local (mode "sans Docker"), la notification se fait ici par un appel HTTP
 * direct, resolu via Eureka (@LoadBalanced), vers un endpoint interne du
 * service cible. Le principe reste le meme : aucune emission de titre,
 * billet, piece ou commande avant cet appel, et chaque service cible reste
 * idempotent (verifie qu'il n'a pas deja traite la transaction).
 *
 * Pour repasser sur RabbitMQ en production (plusieurs instances, tolerance
 * aux pannes du service cible), remplacer webClientBuilder.build().post()
 * par un rabbitTemplate.convertAndSend(...) et redeployer les @RabbitListener
 * correspondants cote services metier (l'ancien code est conserve dans
 * l'historique Git / la documentation du projet).
 */
@Component
public class PaiementConfirmeNotifier {

    private static final Logger log = LoggerFactory.getLogger(PaiementConfirmeNotifier.class);

    private final WebClient.Builder webClientBuilder;

    public PaiementConfirmeNotifier(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    public void notifier(Transaction transaction) {
        String service = resoudreService(transaction.getTypeObjet());
        if (service == null) {
            log.warn("Aucun service cible connu pour le type d'objet {}, notification ignoree.", transaction.getTypeObjet());
            return;
        }

        Map<String, Object> corps = Map.of(
                "transactionId", transaction.getId(),
                "utilisateurId", transaction.getUtilisateurId(),
                "typeObjet", transaction.getTypeObjet().name(),
                "referenceId", transaction.getReferenceId(),
                "montantFcfa", transaction.getMontantFcfa()
        );

        try {
            webClientBuilder.build().post()
                    .uri("http://" + service + "/api/interne/paiement-confirme")
                    .bodyValue(corps)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("Service {} notifie pour la transaction {} ({}).", service, transaction.getId(), transaction.getTypeObjet());
        } catch (Exception e) {
            // En mode local sans file d'attente, un service cible indisponible perd la
            // notification (pas de re-livraison automatique). Acceptable pour un usage
            // de developpement/demo ; a durcir (retry, DLQ) avant une mise en production.
            log.error("Echec de la notification du service {} pour la transaction {} : {}", service, transaction.getId(), e.getMessage());
        }
    }

    private String resoudreService(TypeObjetPaiement typeObjet) {
        return switch (typeObjet) {
            case TITRE, ALBUM -> "musique-service";
            case BILLET, FAN_CLUB -> "live-service";
            case PORTEFEUILLE_PIECES -> "votes-service";
            case COMMANDE -> "boutique-service";
            default -> null;
        };
    }
}
