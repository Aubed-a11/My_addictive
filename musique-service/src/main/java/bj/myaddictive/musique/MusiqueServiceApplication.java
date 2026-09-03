package bj.myaddictive.musique;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Rubrique 2, "Musique". Regroupe Free Music, Music Store, albums et
 * classements (section 5). Le module radio, explicitement retire du
 * perimetre de cette iteration, n'est pas implemente ici.
 */
@SpringBootApplication
public class MusiqueServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MusiqueServiceApplication.class, args);
    }
}
