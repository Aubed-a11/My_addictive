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

    @Transactional
    public void reinitialiserMotDePasse(ReinitialiserMotDePasseRequest requete) {
        String email = requete.email().trim().toLowerCase();
        otpService.verifierCode(email, requete.code());
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Aucun compte associe a cet email."));
        utilisateur.setMotDePasseHash(passwordEncoder.encode(requete.nouveauMotDePasse()));
        utilisateurRepository.save(utilisateur);
    }
}
