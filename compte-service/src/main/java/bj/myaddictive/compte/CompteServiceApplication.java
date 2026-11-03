package bj.myaddictive.compte;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Microservice compte-service : utilisateurs, authentification par email +
 * mot de passe, favoris, communaute (rubrique 6, "Mon compte"). Emet les
 * jetons JWT utilises par tous les autres services.
 */
@SpringBootApplication
public class CompteServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CompteServiceApplication.class, args);
    }
}
