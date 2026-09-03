package bj.myaddictive.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

/**
 * Configuration centralisee et versionnee de tous les microservices.
 * Utilise le profil "native" : les fichiers de config sont lus depuis le
 * dossier /config-repo monte dans le conteneur (pas besoin de depot Git externe
 * pour demarrer rapidement en local ; passer a un backend Git en production).
 */
@SpringBootApplication
@EnableConfigServer
public class ConfigServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServiceApplication.class, args);
    }
}
