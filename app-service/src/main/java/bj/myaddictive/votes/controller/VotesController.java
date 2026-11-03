package bj.myaddictive.votes.controller;

import bj.myaddictive.votes.domain.Candidat;
import bj.myaddictive.votes.domain.Competition;
import bj.myaddictive.votes.dto.AcheterPiecesRequest;
import bj.myaddictive.votes.dto.VoterRequest;
import bj.myaddictive.votes.exception.ApiException;
import bj.myaddictive.votes.service.VotesService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/votes")
public class VotesController {

    private final VotesService votesService;

    public VotesController(VotesService votesService) {
        this.votesService = votesService;
    }

    @GetMapping("/competitions")
    public ResponseEntity<Page<Competition>> listerCompetitions(Pageable pageable) {
        return ResponseEntity.ok(votesService.listerCompetitions(pageable));
    }

    @GetMapping("/competitions/{id}")
    public ResponseEntity<Competition> obtenirCompetition(@PathVariable Long id) {
        return ResponseEntity.ok(votesService.obtenirCompetition(id));
    }

    @GetMapping("/competitions/{id}/candidats")
    public ResponseEntity<List<Candidat>> listerCandidats(@PathVariable Long id) {
        return ResponseEntity.ok(votesService.listerCandidats(id));
    }

    @GetMapping("/candidats/{id}")
    public ResponseEntity<Candidat> obtenirCandidat(@PathVariable Long id) {
        return ResponseEntity.ok(votesService.obtenirCandidat(id));
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
    }

    /** Programmation d'une competition (back-office admin). */
    @PostMapping("/competitions")
    public ResponseEntity<Competition> creerCompetition(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Competition competition) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(votesService.creerCompetition(competition));
    }

    @PutMapping("/competitions/{id}")
    public ResponseEntity<Competition> modifierCompetition(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Competition competition) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(votesService.modifierCompetition(id, competition));
    }

    @DeleteMapping("/competitions/{id}")
    public ResponseEntity<Void> supprimerCompetition(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        exigerAdministrateur(role);
        votesService.supprimerCompetition(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/candidats")
    public ResponseEntity<Candidat> creerCandidat(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Candidat candidat) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(votesService.creerCandidat(candidat));
    }

    @PutMapping("/candidats/{id}")
    public ResponseEntity<Candidat> modifierCandidat(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Candidat candidat) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(votesService.modifierCandidat(id, candidat));
    }

    @DeleteMapping("/candidats/{id}")
    public ResponseEntity<Void> supprimerCandidat(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        exigerAdministrateur(role);
        votesService.supprimerCandidat(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/competitions/{id}/classement")
    public ResponseEntity<List<bj.myaddictive.votes.dto.ClassementEntree>> classement(@PathVariable Long id) {
        return ResponseEntity.ok(votesService.classementPondere(id));
    }

    @GetMapping("/portefeuille")
    public ResponseEntity<Map<String, Long>> soldePortefeuille(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(Map.of("solde", votesService.soldePortefeuille(Long.valueOf(userId))));
    }

    @GetMapping("/portefeuille/mouvements")
    public ResponseEntity<List<bj.myaddictive.votes.domain.MouvementPortefeuille>> historiquePortefeuille(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(votesService.historiquePortefeuille(Long.valueOf(userId)));
    }

    @GetMapping("/mes-votes")
    public ResponseEntity<List<bj.myaddictive.votes.domain.Vote>> mesVotes(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(votesService.mesVotes(Long.valueOf(userId)));
    }

    @PostMapping("/portefeuille/acheter-pieces")
    public ResponseEntity<Map<String, Object>> acheterPieces(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody AcheterPiecesRequest requete) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(votesService.initierAchatPieces(userId, requete));
    }

    @PostMapping("/voter")
    public ResponseEntity<Void> voter(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody VoterRequest requete) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        votesService.voter(Long.valueOf(userId), requete);
        return ResponseEntity.noContent().build();
    }
}
