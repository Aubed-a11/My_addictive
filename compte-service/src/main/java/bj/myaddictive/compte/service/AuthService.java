package bj.myaddictive.compte.service;

import bj.myaddictive.compte.domain.RoleUtilisateur;
import bj.myaddictive.compte.domain.Utilisateur;
import bj.myaddictive.compte.dto.*;
import bj.myaddictive.compte.exception.ApiException;
import bj.myaddictive.compte.repository.UtilisateurRepository;
import bj.myaddictive.compte.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

/** Authentification par email + mot de passe (section 3.2). */
@Service
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UtilisateurRepository utilisateurRepository, OtpService otpService, JwtService jwtService) {
        this.utilisateurRepository = utilisateurRepository;
        this.otpService = otpService;
        this.jwtService = jwtService;
    }

    /** Inscription en une seule etape : cree le compte et connecte immediatement. */
    @Transactional
    public AuthResponse inscrire(InscriptionRequest requete) {
        String email = requete.email().trim().toLowerCase();
        if (utilisateurRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Un compte existe deja avec cet email.");
        }
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail(email);
        utilisateur.setNomComplet(requete.nomComplet());
        utilisateur.setMotDePasseHash(passwordEncoder.encode(requete.motDePasse()));
        utilisateur.setRole(RoleUtilisateur.MEMBRE);
        utilisateur.setActif(true);
        utilisateurRepository.save(utilisateur);

        String jeton = jwtService.genererJeton(utilisateur);
        return new AuthResponse(jeton, UtilisateurResponse.fromEntity(utilisateur));
    }

    // Identifiant client Google : valeur PUBLIQUE par nature (visible dans la page de connexion).
    @org.springframework.beans.factory.annotation.Value("${google.client-id:302316778064-6gdvcltrt4na77ao05kjrec1kl3v6v7s.apps.googleusercontent.com}")
    private String googleClientId;

    private final RestClient restClient = RestClient.create();

    /**
     * Connexion ou creation de compte via "Se connecter avec Google" : le
     * jeton d'identite (ID token) recu du client est verifie directement
     * aupres de Google (jamais fait confiance tel quel), pour s'assurer
     * qu'il est authentique ET destine a notre application (verification
     * du champ "aud"), avant de l'utiliser pour identifier l'utilisateur.
     * Si aucun compte n'existe encore pour cet email, un nouveau compte est
     * cree automatiquement (sans mot de passe, puisque Google tient lieu
     * d'authentification).
     */
    @Transactional
    public AuthResponse connecterAvecGoogle(ConnexionGoogleRequest requete) {
        if (googleClientId == null || googleClientId.isBlank()) {
            googleClientId = "302316778064-6gdvcltrt4na77ao05kjrec1kl3v6v7s.apps.googleusercontent.com"; // variable d'environnement presente mais vide
        }
        Map<String, Object> claims;
        try {
            claims = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token=" + requete.idToken())
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Jeton Google invalide ou expire.");
        }
        if (claims == null || !googleClientId.equals(claims.get("aud"))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Ce jeton Google n'est pas destine a cette application.");
        }
        if (!"true".equals(String.valueOf(claims.get("email_verified")))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "L'adresse email Google associee n'est pas verifiee.");
        }
        String email = String.valueOf(claims.get("email")).trim().toLowerCase();
        String nom = claims.getOrDefault("name", email).toString();
        String photo = claims.get("picture") != null ? claims.get("picture").toString() : null;

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElseGet(() -> {
            Utilisateur nouveau = new Utilisateur();
            nouveau.setEmail(email);
            nouveau.setNomComplet(nom);
            nouveau.setPhotoUrl(photo);
            // Pas de mot de passe : ce compte ne peut se connecter que via Google.
            // Un hash aleatoire et inutilisable est tout de meme pose plutot que
            // null, par precaution si une autre partie du code supposait sa
            // presence pour un utilisateur actif.
            nouveau.setMotDePasseHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            nouveau.setRole(RoleUtilisateur.MEMBRE);
            nouveau.setActif(true);
            nouveau.setEmailVerifie(true); // Google a prouve la propriete de l'adresse
            return utilisateurRepository.save(nouveau);
        });
        if (!utilisateur.isEmailVerifie()) {
            // Compte cree par mot de passe SANS verification de l'e-mail : quelqu'un a pu l'ouvrir avec l'adresse
            // d'autrui. Google prouve maintenant que l'adresse appartient a cette personne : on invalide l'ancien
            // mot de passe (elle pourra en redefinir un via "mot de passe oublie") et on marque l'e-mail verifie.
            utilisateur.setMotDePasseHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            utilisateur.setEmailVerifie(true);
            utilisateurRepository.save(utilisateur);
        }
        if (!utilisateur.isActif()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Ce compte a ete suspendu.");
        }
        String jeton = jwtService.genererJeton(utilisateur);
        return new AuthResponse(jeton, UtilisateurResponse.fromEntity(utilisateur));
    }

    public AuthResponse connecter(ConnexionRequest requete) {
        String email = requete.email().trim().toLowerCase();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect."));

        if (utilisateur.getMotDePasseHash() == null
                || !passwordEncoder.matches(requete.motDePasse(), utilisateur.getMotDePasseHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect.");
        }
        if (!utilisateur.isActif()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Ce compte a ete suspendu.");
        }

        String jeton = jwtService.genererJeton(utilisateur);
        return new AuthResponse(jeton, UtilisateurResponse.fromEntity(utilisateur));
    }

    public void demanderReinitialisationMotDePasse(MotDePasseOublieRequest requete) {
        String email = requete.email().trim().toLowerCase();
        utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Aucun compte associe a cet email."));
        otpService.envoyerCode(email);
    }

    @Transactional(noRollbackFor = ApiException.class) // garde le compteur d'essais du code meme en cas d'erreur
    public void reinitialiserMotDePasse(ReinitialiserMotDePasseRequest requete) {
        String email = requete.email().trim().toLowerCase();
        otpService.verifierCode(email, requete.code());
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Aucun compte associe a cet email."));
        utilisateur.setMotDePasseHash(passwordEncoder.encode(requete.nouveauMotDePasse()));
        utilisateur.setEmailVerifie(true); // le code a ete recu par e-mail : l'adresse est prouvee
        utilisateurRepository.save(utilisateur);
    }
}
