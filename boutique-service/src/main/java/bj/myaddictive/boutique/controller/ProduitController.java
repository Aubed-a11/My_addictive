package bj.myaddictive.boutique.controller;

import bj.myaddictive.boutique.domain.Produit;
import bj.myaddictive.boutique.exception.ApiException;
import bj.myaddictive.boutique.service.BoutiqueService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boutique/produits")
public class ProduitController {

    private final BoutiqueService boutiqueService;

    public ProduitController(BoutiqueService boutiqueService) {
        this.boutiqueService = boutiqueService;
    }

    @GetMapping
    public ResponseEntity<Page<Produit>> lister(
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) Long vendeurId,
            Pageable pageable) {
        return ResponseEntity.ok(boutiqueService.listerProduits(categorie, vendeurId, pageable));
    }

    /** Drops limites avec compte a rebours (section 8.2). */
    @GetMapping("/drops")
    public ResponseEntity<Page<Produit>> listerDrops(Pageable pageable) {
        return ResponseEntity.ok(boutiqueService.listerDrops(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produit> obtenir(@PathVariable Long id) {
        return ResponseEntity.ok(boutiqueService.obtenirProduit(id));
    }

    @PostMapping
    public ResponseEntity<Produit> publier(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Produit produit) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(boutiqueService.publierProduit(Long.valueOf(userId), produit));
    }

    /** Publication/modification/suppression reservees au back-office admin. */
    @PostMapping("/admin")
    public ResponseEntity<Produit> creerAdmin(
            @RequestHeader(value = "X-User-Role", required = false) String role, @RequestBody Produit produit) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(boutiqueService.creerProduitAdmin(produit));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produit> modifier(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id, @RequestBody Produit produit) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(boutiqueService.modifierProduitAdmin(id, produit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @RequestHeader(value = "X-User-Role", required = false) String role, @PathVariable Long id) {
        exigerAdministrateur(role);
        boutiqueService.supprimerProduit(id);
        return ResponseEntity.noContent().build();
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
    }
}
