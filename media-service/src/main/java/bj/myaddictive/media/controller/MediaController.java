package bj.myaddictive.media.controller;

import bj.myaddictive.media.domain.Article;
import bj.myaddictive.media.domain.OffrePromotion;
import bj.myaddictive.media.exception.ApiException;
import bj.myaddictive.media.service.MediaService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Rubrique 1, "Media et actualites". Consultation libre pour tous, y compris
 * les visiteurs non connectes (regle d'acces libre, section 3.1) ; la
 * creation/edition/suppression est reservee au role ADMINISTRATEUR (verifie
 * via l'en-tete X-User-Role transmis par la gateway).
 */
@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
    }

    @GetMapping("/articles")
    public ResponseEntity<Page<Article>> listerArticles(
            @RequestParam(required = false) String categorie,
            @RequestParam(defaultValue = "false") boolean aLaUne,
            Pageable pageable) {
        return ResponseEntity.ok(mediaService.listerArticles(categorie, aLaUne, pageable));
    }

    @GetMapping("/articles/{id}")
    public ResponseEntity<Article> obtenirArticle(@PathVariable Long id) {
        return ResponseEntity.ok(mediaService.obtenirArticle(id));
    }

    @PostMapping("/articles")
    public ResponseEntity<Article> creerArticle(
            @RequestHeader(value = "X-User-Role", required = false) String role, @RequestBody Article article) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(mediaService.creerArticle(article));
    }

    @PutMapping("/articles/{id}")
    public ResponseEntity<Article> modifierArticle(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Article article) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(mediaService.modifierArticle(id, article));
    }

    @DeleteMapping("/articles/{id}")
    public ResponseEntity<Void> supprimerArticle(
            @RequestHeader(value = "X-User-Role", required = false) String role, @PathVariable Long id) {
        exigerAdministrateur(role);
        mediaService.supprimerArticle(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/offres-promotion")
    public ResponseEntity<List<OffrePromotion>> listerOffresPromotion() {
        return ResponseEntity.ok(mediaService.listerOffresPromotion());
    }
}
