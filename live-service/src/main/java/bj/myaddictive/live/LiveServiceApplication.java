package bj.myaddictive.live;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Rubrique 3, "Billetterie et live" (section 6) : evenements, billets a QR
 * code, chaines d'organisateurs/artistes, podcasts. Le compteur de
 * spectateurs en temps reel s'appuie sur Redis (section 19, cache/temps reel).
 */
@SpringBootApplication
public class LiveServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(LiveServiceApplication.class, args);
    }
}
