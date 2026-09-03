package bj.myaddictive.musique.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Client HTTP interne vers paiement-service, resolu dynamiquement via Eureka
 * (@LoadBalanced) : appeler "http://paiement-service/..." suffit, pas besoin
 * de connaitre l'IP/port du conteneur.
 */
@Configuration
public class WebClientConfig {

    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}
