package bj.myaddictive.musique.controller;

import bj.myaddictive.musique.domain.Achat;
import bj.myaddictive.musique.domain.Album;
import bj.myaddictive.musique.domain.Titre;
import bj.myaddictive.musique.dto.InitierAchatRequest;
import bj.myaddictive.musique.exception.ApiException;
import bj.myaddictive.musique.service.MusiqueService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/musique")
public class MusiqueController {

    private final MusiqueService musiqueService;

    public MusiqueController(MusiqueService musiqueService) {
        this.musiqueService = musiqueService;
    }

    @GetMapping("/titres")
    public ResponseEntity<Page<Titre>> listerTitres(
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Boolean gratuit,
            @RequestParam(required = false) String artiste,
            Pageable pageable) {
        return ResponseEntity.ok(musiqueService.listerTitres(genre, gratuit, artiste, pageable));
    }

    @GetMapping("/titres/{id}")
    public ResponseEntity<Titre> obtenirTitre(@PathVariable Long id) {
        return ResponseEntity.ok(musiqueService.obtenirTitre(id));
    }

    @PostMapping("/titres/{id}/ecouter")
    public ResponseEntity<Titre> ecouter(@PathVariable Long id) {
        return ResponseEntity.ok(musiqueService.ecouter(id));
    }

    @GetMapping("/albums")
    public ResponseEntity<Page<Album>> listerAlbums(Pageable pageable) {
        return ResponseEntity.ok(musiqueService.listerAlbums(pageable));
    }

    @GetMapping("/albums/{id}")
    public ResponseEntity<Album> obtenirAlbum(@PathVariable Long id) {
        return ResponseEntity.ok(musiqueService.obtenirAlbum(id));
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
    }

    /** Publication d'un titre/album (back-office admin). */
    @PostMapping("/titres")
    public ResponseEntity<Titre> creerTitre(
            @RequestHeader(value = "X-User-Role", required = false) String role, @RequestBody Titre titre) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(musiqueService.creerTitre(titre));
    }

    @PutMapping("/titres/{id}")
    public ResponseEntity<Titre> modifierTitre(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Titre titre) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(musiqueService.modifierTitre(id, titre));
    }

    @DeleteMapping("/titres/{id}")
    public ResponseEntity<Void> supprimerTitre(
            @RequestHeader(value = "X-User-Role", required = false) String role, @PathVariable Long id) {
        exigerAdministrateur(role);
        musiqueService.supprimerTitre(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/albums")
    public ResponseEntity<Album> creerAlbum(
            @RequestHeader(value = "X-User-Role", required = false) String role, @RequestBody Album album) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(musiqueService.creerAlbum(album));
    }

    @PutMapping("/albums/{id}")
    public ResponseEntity<Album> modifierAlbum(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Album album) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(musiqueService.modifierAlbum(id, album));
    }

    @DeleteMapping("/albums/{id}")
    public ResponseEntity<Void> supprimerAlbum(
            @RequestHeader(value = "X-User-Role", required = false) String role, @PathVariable Long id) {
        exigerAdministrateur(role);
        musiqueService.supprimerAlbum(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/classements")
    public ResponseEntity<Page<Titre>> classement(@RequestParam(defaultValue = "streaming") String type, Pageable pageable) {
        return ResponseEntity.ok(musiqueService.classement(type, pageable));
    }

    @PostMapping("/achats/initier")
    public ResponseEntity<Map<String, Object>> initierAchat(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody InitierAchatRequest requete) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(musiqueService.initierAchat(userId, requete));
    }

    @GetMapping("/mes-achats")
    public ResponseEntity<List<Achat>> mesAchats(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(musiqueService.mesAchats(Long.valueOf(userId)));
    }

    /** Enregistre une ecoute dans l'historique personnel (section 9.1). L'ecoute elle-meme (compteur global) reste publique via /ecouter. */
    @PostMapping("/titres/{id}/historiser")
    public ResponseEntity<Void> historiser(
            @RequestHeader(value = "X-User-Id", required = false) String userId, @PathVariable Long id) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        musiqueService.historiserEcoute(Long.valueOf(userId), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mes-ecoutes")
    public ResponseEntity<List<bj.myaddictive.musique.domain.Ecoute>> mesEcoutes(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(musiqueService.mesEcoutes(Long.valueOf(userId)));
    }

    /** Recommandations personnalisees a partir de l'historique d'ecoute (section 5.2). */
    @GetMapping("/recommandations")
    public ResponseEntity<List<Titre>> recommandations(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(musiqueService.recommandations(Long.valueOf(userId)));
    }
}
