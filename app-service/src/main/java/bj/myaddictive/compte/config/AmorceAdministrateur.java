package bj.myaddictive.compte.config;

import bj.myaddictive.compte.domain.RoleUtilisateur;
import bj.myaddictive.compte.domain.Utilisateur;
import bj.myaddictive.compte.repository.UtilisateurRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Cree automatiquement un compte ADMINISTRATEUR au tout premier demarrage
 * (aucune inscription normale ne peut creer ce role). Identifiants
 * personnalisables via les variables d'environnement ADMIN_EMAIL /
 * ADMIN_MOT_DE_PASSE ; a changer immediatement en production.
 */
@Component
@Order(1)
public class AmorceAdministrateur implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AmorceAdministrateur.class);
    private final UtilisateurRepository utilisateurRepository;
    private final String email;
    private final String motDePasse;

    public AmorceAdministrateur(UtilisateurRepository utilisateurRepository,
                                 @Value("${admin.email:admin@myaddictive.com}") String email,
                                 @Value("${admin.mot-de-passe:AdminAddictive2026!}") String motDePasse) {
        this.utilisateurRepository = utilisateurRepository;
        this.email = email;
        this.motDePasse = motDePasse;
    }

    @Override
    public void run(String... args) {
        if (utilisateurRepository.existsByEmail(email)) {
            return;
        }
        Utilisateur admin = new Utilisateur();
        admin.setEmail(email);
        admin.setNomComplet("Administrateur");
        admin.setRole(RoleUtilisateur.ADMINISTRATEUR);
        admin.setMotDePasseHash(new BCryptPasswordEncoder().encode(motDePasse));
        utilisateurRepository.save(admin);

        log.warn("Compte administrateur cree automatiquement : {} / mot de passe : {} -- A CHANGER en production (variables ADMIN_EMAIL / ADMIN_MOT_DE_PASSE).",
                email, motDePasse);
    }
}
