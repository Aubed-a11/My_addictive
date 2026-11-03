package bj.myaddictive.live.controller;

import bj.myaddictive.live.dto.CreerSondageRequest;
import bj.myaddictive.live.dto.SondageResultat;
import bj.myaddictive.live.dto.VoterSondageRequest;
import bj.myaddictive.live.exception.ApiException;
import bj.myaddictive.live.service.SondageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Sondages et questions-reponses en direct (section 6.5). La creation et
 * la cloture sont reservees a l'administration/l'organisateur ; la
 * consultation des resultats reste libre ; le vote exige une connexion
 * (un seul vote par utilisateur et par sondage).
 */
@RestController
@RequestMapping("/api/live")
public class SondageController {

    private final SondageService sondageService;

    public SondageController(SondageService sondageService) {
        this.sondageService = sondageService;
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs/organisateurs.");
        }
    }

    @PostMapping("/evenements/{evenementId}/sondages")
    public ResponseEntity<SondageResultat> creer(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long evenementId, @Valid @RequestBody CreerSondageRequest requete) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(sondageService.creerSondage(evenementId, requete));
    }

    @GetMapping("/evenements/{evenementId}/sondages")
    public ResponseEntity<List<SondageResultat>> lister(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long evenementId) {
        Long utilisateurId = userId != null ? Long.valueOf(userId) : null;
        return ResponseEntity.ok(sondageService.listerSondagesActifs(evenementId, utilisateurId));
    }

    @PostMapping("/sondages/{id}/voter")
    public ResponseEntity<SondageResultat> voter(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long id, @Valid @RequestBody VoterSondageRequest requete) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise pour voter.");
        return ResponseEntity.ok(sondageService.voter(id, requete.optionId(), Long.valueOf(userId)));
    }

    @PutMapping("/sondages/{id}/cloturer")
    public ResponseEntity<SondageResultat> cloturer(
            @RequestHeader(value = "X-User-Role", required = false) String role, @PathVariable Long id) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(sondageService.cloturer(id));
    }
}
