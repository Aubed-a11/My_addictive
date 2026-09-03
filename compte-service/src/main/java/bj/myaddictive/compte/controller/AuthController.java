package bj.myaddictive.compte.controller;

import bj.myaddictive.compte.dto.*;
import bj.myaddictive.compte.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Ecran de connexion (section 3.2) : inscription par email + mot de passe
 * (en une seule etape), connexion, mot de passe oublie (code envoye par
 * email). Ces routes restent publiques (pas de JWT requis) puisqu'elles
 * servent justement a en obtenir un.
 */
@RestController
@RequestMapping("/api/compte/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/inscription")
    public ResponseEntity<AuthResponse> inscription(@Valid @RequestBody InscriptionRequest requete) {
        return ResponseEntity.ok(authService.inscrire(requete));
    }

    @PostMapping("/connexion")
    public ResponseEntity<AuthResponse> connexion(@Valid @RequestBody ConnexionRequest requete) {
        return ResponseEntity.ok(authService.connecter(requete));
    }

    @PostMapping("/mot-de-passe-oublie")
    public ResponseEntity<Map<String, String>> motDePasseOublie(@Valid @RequestBody MotDePasseOublieRequest requete) {
        authService.demanderReinitialisationMotDePasse(requete);
        return ResponseEntity.ok(Map.of("message", "Un code de verification a ete envoye par email."));
    }

    @PostMapping("/reinitialiser-mot-de-passe")
    public ResponseEntity<Map<String, String>> reinitialiser(@Valid @RequestBody ReinitialiserMotDePasseRequest requete) {
        authService.reinitialiserMotDePasse(requete);
        return ResponseEntity.ok(Map.of("message", "Mot de passe reinitialise avec succes."));
    }
}
