package bj.myaddictive.live.controller;

import bj.myaddictive.live.domain.Episode;
import bj.myaddictive.live.domain.Podcast;
import bj.myaddictive.live.exception.ApiException;
import bj.myaddictive.live.service.LiveService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/live/podcasts")
public class PodcastController {

    private final LiveService liveService;

    public PodcastController(LiveService liveService) {
        this.liveService = liveService;
    }

    @GetMapping
    public ResponseEntity<Page<Podcast>> lister(Pageable pageable) {
        return ResponseEntity.ok(liveService.listerPodcasts(pageable));
    }

    @GetMapping("/{id}/episodes")
    public ResponseEntity<List<Episode>> episodes(@PathVariable Long id) {
        return ResponseEntity.ok(liveService.listerEpisodes(id));
    }

    /** Abonnement a une emission (section 6.4). */
    @PostMapping("/{id}/abonnement")
    public ResponseEntity<Void> abonner(
            @RequestHeader(value = "X-User-Id", required = false) String userId, @PathVariable Long id) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        liveService.abonnerPodcast(Long.valueOf(userId), id);
        return ResponseEntity.noContent().build();
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
    }

    @PostMapping
    public ResponseEntity<Podcast> creer(
            @RequestHeader(value = "X-User-Role", required = false) String role, @RequestBody Podcast podcast) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(liveService.creerPodcast(podcast));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Podcast> modifier(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Podcast podcast) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(liveService.modifierPodcast(id, podcast));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @RequestHeader(value = "X-User-Role", required = false) String role, @PathVariable Long id) {
        exigerAdministrateur(role);
        liveService.supprimerPodcast(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/episodes")
    public ResponseEntity<Episode> creerEpisode(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Episode episode) {
        exigerAdministrateur(role);
        episode.setPodcastId(id);
        return ResponseEntity.ok(liveService.creerEpisode(episode));
    }

    @DeleteMapping("/episodes/{id}")
    public ResponseEntity<Void> supprimerEpisode(
            @RequestHeader(value = "X-User-Role", required = false) String role, @PathVariable Long id) {
        exigerAdministrateur(role);
        liveService.supprimerEpisode(id);
        return ResponseEntity.noContent().build();
    }
}
