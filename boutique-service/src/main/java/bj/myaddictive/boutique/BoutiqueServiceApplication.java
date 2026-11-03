package bj.myaddictive.boutique;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Rubrique 5, "Boutique" (section 8) : marketplace generaliste multi-vendeurs,
 * ouverte a tout commercant (pas seulement aux artistes). Un vendeur ne peut
 * publier son catalogue qu'apres validation de son compte marchand par
 * l'administration.
 */
@SpringBootApplication
public class BoutiqueServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BoutiqueServiceApplication.class, args);
    }
}
