package bj.myaddictive.paiement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Service transverse de paiement (section 10 et 21.4 du cahier des charges).
 * Point d'integration unique avec mobile money (MTN, Moov, Celtiis Cash) et
 * carte bancaire, partage par Musique, Billetterie, Votes et Boutique.
 *
 * Regle d'or : aucune emission de titre, billet, piece ou commande avant
 * confirmation du paiement. La confirmation est traitee de facon idempotente
 * et propagee aux autres services via un evenement RabbitMQ
 * "paiement.confirme", jamais par appel synchrone bloquant.
 */
@SpringBootApplication
@EnableScheduling // necessaire pour PaiementRelanceScheduler (filet de securite de confirmation automatique)
public class PaiementServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaiementServiceApplication.class, args);
    }
}
