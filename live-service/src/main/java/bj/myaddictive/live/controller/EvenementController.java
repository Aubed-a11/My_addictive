package bj.myaddictive.live.controller;

import bj.myaddictive.live.domain.Billet;
import bj.myaddictive.live.domain.Evenement;
import bj.myaddictive.live.domain.StatutEvenement;
import bj.myaddictive.live.dto.InitierAchatBilletRequest;
import bj.myaddictive.live.dto.MessageChat;
import bj.myaddictive.live.exception.ApiException;
import bj.myaddictive.live.service.ChatLiveService;
import bj.myaddictive.live.service.LiveService;
import bj.myaddictive.live.service.ViewerCountService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/live")
public class EvenementController {

    private final LiveService liveService;
    private final ViewerCountService viewerCountService;
    private final ChatLiveService chatLiveService;

    public EvenementController(LiveService liveService, ViewerCountService viewerCountService, ChatLiveService chatLiveService) {
        this.liveService = liveService;
        this.viewerCountService = viewerCountService;
        this.chatLiveService = chatLiveService;
    }

    @GetMapping("/evenements")
    public ResponseEntity<Page<Evenement>> lister(@RequestParam(required = false) StatutEvenement statut, Pageable pageable) {
        return ResponseEntity.ok(liveService.listerEvenements(statut, pageable));
    }

    @GetMapping("/evenements/{id}")
    public ResponseEntity<Evenement> obtenir(@PathVariable Long id) {
        return ResponseEntity.ok(liveService.obtenirEvenement(id));
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
    }

    private void exigerAdminOuOrganisateur(String role) {
        if (!"ADMINISTRATEUR".equals(role) && !"ORGANISATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs et organisateurs.");
        }
    }

    /**
     * Creation/programmation d'un evenement (section 6.1). Ouverte a
     * l'auto-service : un utilisateur au role ORGANISATEUR peut creer et
     * diffuser son propre spectacle, comme un administrateur.
     */
    @PostMapping("/evenements")
    public ResponseEntity<Evenement> creer(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Evenement evenement) {
        exigerAdminOuOrganisateur(role);
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(liveService.creerEvenement(Long.valueOf(userId), evenement));
    }

    @PutMapping("/evenements/{id}")
    public ResponseEntity<Evenement> modifier(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Evenement evenement) {
        exigerAdminOuOrganisateur(role);
        Long uid = userId != null ? Long.valueOf(userId) : null;
        return ResponseEntity.ok(liveService.modifierEvenement(id, evenement, uid, "ADMINISTRATEUR".equals(role)));
    }

    @DeleteMapping("/evenements/{id}")
    public ResponseEntity<Void> supprimer(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        exigerAdminOuOrganisateur(role);
        Long uid = userId != null ? Long.valueOf(userId) : null;
        liveService.supprimerEvenement(id, uid, "ADMINISTRATEUR".equals(role));
        return ResponseEntity.noContent().build();
    }

    /** Mes evenements crees (auto-service organisateur). */
    @GetMapping("/mes-evenements")
    public ResponseEntity<List<Evenement>> mesEvenements(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(liveService.mesEvenementsCrees(Long.valueOf(userId)));
    }

    @PostMapping("/billets/initier-achat")
    public ResponseEntity<Map<String, Object>> initierAchat(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody InitierAchatBilletRequest requete) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(liveService.initierAchatBillet(userId, requete));
    }

    @GetMapping("/billets/mes-billets")
    public ResponseEntity<List<bj.myaddictive.live.dto.BilletResponse>> mesBillets(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(liveService.mesBillets(Long.valueOf(userId)));
    }

    @PostMapping("/billets/scanner/{codeQr}")
    public ResponseEntity<Billet> scanner(@PathVariable String codeQr) {
        return ResponseEntity.ok(liveService.scannerBillet(codeQr));
    }

    @PostMapping("/evenements/{id}/spectateurs/entrer")
    public ResponseEntity<Long> entrerDansLeFlux(@PathVariable Long id) {
        return ResponseEntity.ok(viewerCountService.entrer(id));
    }

    @PostMapping("/evenements/{id}/spectateurs/sortir")
    public ResponseEntity<Long> sortirDuFlux(@PathVariable Long id) {
        return ResponseEntity.ok(viewerCountService.sortir(id));
    }

    @GetMapping("/evenements/{id}/spectateurs")
    public ResponseEntity<Long> spectateurs(@PathVariable Long id) {
        return ResponseEntity.ok(viewerCountService.obtenir(id));
    }

    /** Chat en direct (section 6.5). Lecture libre, ecriture reservee aux connectes. */
    @GetMapping("/evenements/{id}/messages")
    public ResponseEntity<List<MessageChat>> messages(@PathVariable Long id) {
        return ResponseEntity.ok(chatLiveService.obtenirMessages(id));
    }

    @PostMapping("/evenements/{id}/messages")
    public ResponseEntity<MessageChat> envoyerMessage(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long id, @RequestBody Map<String, String> corps) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise pour ecrire dans le chat.");
        String contenu = corps.getOrDefault("contenu", "").trim();
        if (contenu.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Le message ne peut pas etre vide.");
        return ResponseEntity.ok(chatLiveService.envoyer(id, "Utilisateur " + userId, contenu));
    }
}
