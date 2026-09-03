package bj.myaddictive.live.controller;

import bj.myaddictive.live.domain.Chaine;
import bj.myaddictive.live.exception.ApiException;
import bj.myaddictive.live.service.LiveService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/live")
public class ChaineController {

    private final LiveService liveService;

    public ChaineController(LiveService liveService) {
        this.liveService = liveService;
    }

    @GetMapping("/chaines")
    public ResponseEntity<Page<Chaine>> lister(Pageable pageable) {
        return ResponseEntity.ok(liveService.listerChaines(pageable));
    }

    @GetMapping("/chaines/{id}")
    public ResponseEntity<Chaine> obtenir(@PathVariable Long id) {
        return ResponseEntity.ok(liveService.obtenirChaine(id));
    }

    /** Chemin distinct de /chaines pour que la gateway puisse exiger une connexion ici sans bloquer la consultation libre des chaines. */
    @PostMapping("/abonnements-chaine/{id}")
    public ResponseEntity<Void> abonner(@RequestHeader(value = "X-User-Id", required = false) String userId, @PathVariable Long id) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        liveService.abonner(Long.valueOf(userId), id);
        return ResponseEntity.noContent().build();
    }

    /** Chaines suivies (recommandations media, section 4.2). */
    @GetMapping("/mes-chaines-suivies")
    public ResponseEntity<List<Chaine>> mesChainesSuivies(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(liveService.mesChainesSuivies(Long.valueOf(userId)));
    }

    /** Fan club / abonnement mensuel a un artiste (section 9.2). */
    @PostMapping("/chaines/{id}/fan-club/initier")
    public ResponseEntity<Map<String, Object>> initierFanClub(
            @RequestHeader(value = "X-User-Id", required = false) String userId, @PathVariable Long id) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(liveService.initierAbonnementFanClub(userId, id));
    }

    @GetMapping("/chaines/{id}/fan-club/statut")
    public ResponseEntity<Map<String, Object>> statutFanClub(
            @RequestHeader(value = "X-User-Id", required = false) String userId, @PathVariable Long id) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(liveService.statutFanClub(Long.valueOf(userId), id));
    }

    private void exigerAutoServiceChaine(String role) {
        if (!"ADMINISTRATEUR".equals(role) && !"ORGANISATEUR".equals(role) && !"ARTISTE".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs, organisateurs et artistes.");
        }
    }

    /** Creation d'une chaine (back-office admin, ou auto-service organisateur/artiste). */
    @PostMapping("/chaines")
    public ResponseEntity<Chaine> creer(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Chaine chaine) {
        exigerAutoServiceChaine(role);
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(liveService.creerChaine(Long.valueOf(userId), chaine));
    }

    @PutMapping("/chaines/{id}")
    public ResponseEntity<Chaine> modifier(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Chaine chaine) {
        exigerAutoServiceChaine(role);
        return ResponseEntity.ok(liveService.modifierChaine(id, chaine));
    }

    @DeleteMapping("/chaines/{id}")
    public ResponseEntity<Void> supprimer(
            @RequestHeader(value = "X-User-Role", required = false) String role, @PathVariable Long id) {
        exigerAutoServiceChaine(role);
        liveService.supprimerChaine(id);
        return ResponseEntity.noContent().build();
    }
}
