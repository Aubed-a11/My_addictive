package bj.myaddictive.boutique.controller;

import bj.myaddictive.boutique.domain.StatutVendeur;
import bj.myaddictive.boutique.domain.Vendeur;
import bj.myaddictive.boutique.dto.InscriptionVendeurRequest;
import bj.myaddictive.boutique.exception.ApiException;
import bj.myaddictive.boutique.service.BoutiqueService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boutique/vendeurs")
public class VendeurController {

    private final BoutiqueService boutiqueService;

    public VendeurController(BoutiqueService boutiqueService) {
        this.boutiqueService = boutiqueService;
    }

    @GetMapping
    public ResponseEntity<Page<Vendeur>> lister(Pageable pageable) {
        return ResponseEntity.ok(boutiqueService.listerVendeursValides(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vendeur> obtenir(@PathVariable Long id) {
        return ResponseEntity.ok(boutiqueService.obtenirVendeur(id));
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
    }

    /** Vue back-office : toutes les demandes d'ouverture de boutique (EN_ATTENTE, VALIDE, REFUSE, SUSPENDU). */
    @GetMapping("/admin")
    public ResponseEntity<Page<Vendeur>> listerTous(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) StatutVendeur statut,
            Pageable pageable) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(boutiqueService.listerTousVendeurs(statut, pageable));
    }

    @PostMapping("/inscription")
    public ResponseEntity<Vendeur> inscription(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody InscriptionVendeurRequest requete) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(boutiqueService.demanderOuvertureBoutique(Long.valueOf(userId), requete));
    }

    /** Reserve au back office (section 28.5). */
    @PutMapping("/{id}/statut")
    public ResponseEntity<Vendeur> changerStatut(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestParam StatutVendeur statut) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(boutiqueService.changerStatutVendeur(id, statut));
    }
}
