package bj.myaddictive.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Porte d'entree unique de la plateforme. Toutes les requetes du client
 * React Native transitent ici, qui les route vers le microservice concerne
 * (decouvert via Eureka) et verifie le jeton JWT sur les routes protegees.
 */
@SpringBootApplication
public class GatewayServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayServiceApplication.class, args);
    }
}
