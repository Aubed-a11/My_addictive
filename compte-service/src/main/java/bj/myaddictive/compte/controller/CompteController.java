package bj.myaddictive.compte.controller;

import bj.myaddictive.compte.dto.*;
import bj.myaddictive.compte.exception.ApiException;
import bj.myaddictive.compte.service.CompteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Rubrique 6, "Mon compte" : profil et favoris. Protegees par la gateway
 * (JwtAuthenticationFilter) qui transmet l'utilisateur authentifie via
 * l'en-tete X-User-Id ; on la revalide ici en defense en profondeur.
 */
@RestController
@RequestMapping("/api/compte")
public class CompteController {

    private final CompteService compteService;

    public CompteController(CompteService compteService) {
        this.compteService = compteService;
    }

    private Long exigerUtilisateur(String userIdHeader) {
        if (userIdHeader == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        }
        return Long.valueOf(userIdHeader);
    }

    @GetMapping("/moi")
    public ResponseEntity<UtilisateurResponse> monProfil(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        Long id = exigerUtilisateur(userId);
        return ResponseEntity.ok(UtilisateurResponse.fromEntity(compteService.obtenirParId(id)));
    }

    @PutMapping("/moi")
    public ResponseEntity<UtilisateurResponse> mettreAJourProfil(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody MettreAJourProfilRequest requete) {
        Long id = exigerUtilisateur(userId);
        return ResponseEntity.ok(UtilisateurResponse.fromEntity(compteService.mettreAJourProfil(id, requete)));
    }

    /** Changement de mot de passe depuis les parametres (section 9.2). */
    @PostMapping("/moi/changer-mot-de-passe")
    public ResponseEntity<Void> changerMotDePasse(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody ChangerMotDePasseRequest requete) {
        Long id = exigerUtilisateur(userId);
        compteService.changerMotDePasse(id, requete);
        return ResponseEntity.noContent().build();
    }

    /** Upload/modification de la photo de profil (section 9.2, a l'inscription ou depuis les parametres). */
    @PostMapping(value = "/moi/photo", consumes = "multipart/form-data")
    public ResponseEntity<UtilisateurResponse> uploaderPhoto(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam("fichier") org.springframework.web.multipart.MultipartFile fichier) {
        Long id = exigerUtilisateur(userId);
        return ResponseEntity.ok(UtilisateurResponse.fromEntity(compteService.uploaderPhoto(id, fichier)));
    }

    @GetMapping("/favoris")
    public ResponseEntity<List<bj.myaddictive.compte.domain.Favori>> mesFavoris(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        Long id = exigerUtilisateur(userId);
        return ResponseEntity.ok(compteService.listerFavoris(id));
    }

    @PostMapping("/favoris")
    public ResponseEntity<bj.myaddictive.compte.domain.Favori> ajouterFavori(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody FavoriRequest requete) {
        Long id = exigerUtilisateur(userId);
        return ResponseEntity.ok(compteService.ajouterFavori(id, requete));
    }

    @DeleteMapping("/favoris/{favoriId}")
    public ResponseEntity<Void> retirerFavori(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long favoriId) {
        Long id = exigerUtilisateur(userId);
        compteService.retirerFavori(favoriId, id);
        return ResponseEntity.noContent().build();
    }

    /** Utilise en interne par les autres microservices (ex : live-service) pour recuperer un profil public. */
    @GetMapping("/{id}/public")
    public ResponseEntity<UtilisateurResponse> profilPublic(@PathVariable Long id) {
        return ResponseEntity.ok(UtilisateurResponse.fromEntity(compteService.obtenirParId(id)));
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
    }

    /** Liste de tous les utilisateurs (back-office, pour attribuer des roles). */
    @GetMapping("/admin/utilisateurs")
    public ResponseEntity<List<UtilisateurResponse>> listerUtilisateurs(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        exigerAdministrateur(role);
        List<UtilisateurResponse> reponse = compteService.listerTousUtilisateurs().stream()
                .map(UtilisateurResponse::fromEntity).toList();
        return ResponseEntity.ok(reponse);
    }

    /** Changement de role (ex. promouvoir un membre en ORGANISATEUR pour l'auto-service d'evenements, section 6.1). */
    @PutMapping("/admin/utilisateurs/{id}/role")
    public ResponseEntity<UtilisateurResponse> changerRole(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestParam bj.myaddictive.compte.domain.RoleUtilisateur nouveauRole) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(UtilisateurResponse.fromEntity(compteService.changerRole(id, nouveauRole)));
    }
}
