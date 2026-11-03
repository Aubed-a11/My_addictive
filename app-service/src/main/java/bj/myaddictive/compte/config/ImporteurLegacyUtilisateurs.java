package bj.myaddictive.compte.config;

import bj.myaddictive.compte.domain.RoleUtilisateur;
import bj.myaddictive.compte.domain.Utilisateur;
import bj.myaddictive.compte.repository.UtilisateurRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

/**
 * Import ponctuel des comptes utilisateurs de l'ancien site My Addictive
 * (extraits de la table mob_utilisateurs), a partir de
 * resources/legacy/utilisateurs_legacy.json.
 *
 * L'authentification de ce projet est basee sur l'email (le numero de
 * telephone a ete retire du parcours de connexion). Les comptes legacy qui
 * n'avaient pas d'email renseigne recoivent une adresse de reference generee
 * a partir de leur telephone d'origine (ex. 22995278428@legacy.myaddictive.local),
 * garantissant l'unicite mais inutilisable pour se connecter tant que
 * l'utilisateur ne l'a pas mise a jour depuis son profil.
 *
 * IMPORTANT — mots de passe : les hachages d'origine (format phpass "$P$...",
 * utilise par WordPress/ancien PHP) sont incompatibles avec le hachage BCrypt
 * de ce service. Chaque compte importe recoit donc un mot de passe temporaire
 * aleatoire, inutilisable tel quel : les utilisateurs concernes devront
 * passer par "mot de passe oublie" pour definir un nouveau mot de passe et
 * se reconnecter. C'est la seule maniere sure de migrer des comptes sans
 * jamais connaitre ni rejouer le mot de passe d'origine.
 *
 * Ne s'execute qu'une seule fois (garde sur le nombre de comptes deja en base).
 */
@Component
@Order(2) // apres AmorceAdministrateur
public class ImporteurLegacyUtilisateurs implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ImporteurLegacyUtilisateurs.class);
    private static final String FICHIER = "legacy/utilisateurs_legacy.json";

    private final UtilisateurRepository utilisateurRepository;
    private final BCryptPasswordEncoder encodeur = new BCryptPasswordEncoder();

    public ImporteurLegacyUtilisateurs(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    private record LigneImport(
            String indicatifPays, String telephone, String nomComplet, String email,
            boolean actif, boolean telephoneVerifie, String motDePasseTemporaire,
            String role, String sourceLegacyId) {
    }

    @Override
    public void run(String... args) throws Exception {
        if (utilisateurRepository.count() > 5) {
            log.info("Import legacy des utilisateurs deja effectue ({} comptes en base), etape ignoree.", utilisateurRepository.count());
            return;
        }

        ClassPathResource ressource = new ClassPathResource(FICHIER);
        if (!ressource.exists()) {
            log.info("Aucun fichier {} trouve, import legacy ignore.", FICHIER);
            return;
        }

        ObjectMapper mapper = new ObjectMapper();
        List<LigneImport> lignes;
        try (InputStream in = ressource.getInputStream()) {
            lignes = mapper.readValue(in, mapper.getTypeFactory().constructCollectionType(List.class, LigneImport.class));
        }

        // Pas de @Transactional global : une ligne de donnees problematique ne
        // doit jamais faire echouer tout l'import ni empecher le demarrage.
        int importes = 0;
        int ignores = 0;
        int erreurs = 0;
        int emailsGeneres = 0;
        for (LigneImport ligne : lignes) {
            try {
                String email = (ligne.email() == null || ligne.email().isBlank()) ? null : ligne.email().trim().toLowerCase();
                if (email == null) {
                    if (ligne.telephone() == null || ligne.telephone().isBlank()) {
                        ignores++;
                        continue;
                    }
                    String indicatifNettoye = (ligne.indicatifPays() == null ? "" : ligne.indicatifPays()).replace("+", "");
                    email = indicatifNettoye + ligne.telephone() + "@legacy.myaddictive.local";
                    emailsGeneres++;
                }
                if (utilisateurRepository.existsByEmail(email)) {
                    ignores++;
                    continue;
                }
                Utilisateur u = new Utilisateur();
                u.setEmail(email);
                u.setIndicatifPays(ligne.indicatifPays());
                u.setTelephone(ligne.telephone());
                u.setNomComplet(ligne.nomComplet());
                u.setActif(ligne.actif());
                // Mot de passe temporaire aleatoire, jamais communique : l'utilisateur
                // doit obligatoirement passer par la reinitialisation pour se reconnecter.
                u.setMotDePasseHash(encodeur.encode(ligne.motDePasseTemporaire()));
                u.setRole(RoleUtilisateur.MEMBRE);
                utilisateurRepository.save(u);
                importes++;
            } catch (Exception e) {
                erreurs++;
                log.warn("Ligne ignoree lors de l'import legacy (utilisateur source id={}) : {}", ligne.sourceLegacyId(), e.getMessage());
            }
        }

        log.info("Import legacy des utilisateurs termine : {} comptes crees ({} avec email genere depuis le telephone), {} ignores, {} en erreur (sur {} lignes source).",
                importes, emailsGeneres, ignores, erreurs, lignes.size());
        if (importes > 0) {
            log.warn("Les comptes importes ont un mot de passe temporaire inutilisable : ils doivent passer par 'mot de passe oublie' pour se reconnecter (avec un email valide pour ceux dont l'email a ete genere automatiquement).");
        }
    }
}
