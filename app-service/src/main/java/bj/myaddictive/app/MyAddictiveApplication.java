package bj.myaddictive.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.FullyQualifiedAnnotationBeanNameGenerator;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Application unique regroupant les 7 anciens microservices metier : compte, media, musique,
 * live, votes, boutique et paiement. Chaque domaine garde son propre package
 * (bj.myaddictive.compte, ...) et son prefixe de tables dans la base SQLite commune.
 *
 * Les noms de beans sont qualifies par le package (FullyQualifiedAnnotationBeanNameGenerator) :
 * plusieurs domaines ont des classes de meme nom (InterneController, GlobalExceptionHandler...).
 */
@SpringBootApplication(scanBasePackages = "bj.myaddictive", nameGenerator = FullyQualifiedAnnotationBeanNameGenerator.class)
@EntityScan(basePackages = "bj.myaddictive")
@EnableJpaRepositories(basePackages = "bj.myaddictive")
@EnableScheduling // PaiementRelanceScheduler : filet de securite de confirmation automatique
public class MyAddictiveApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyAddictiveApplication.class, args);
    }
}
