package bj.myaddictive.boutique.controller;

import bj.myaddictive.boutique.domain.Commande;
import bj.myaddictive.boutique.domain.LigneCommande;
import bj.myaddictive.boutique.domain.PanierItem;
import bj.myaddictive.boutique.dto.AjouterPanierRequest;
import bj.myaddictive.boutique.dto.InitierCommandeRequest;
import bj.myaddictive.boutique.exception.ApiException;
import bj.myaddictive.boutique.service.BoutiqueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boutique")
public class PanierController {

    private final BoutiqueService boutiqueService;

    public PanierController(BoutiqueService boutiqueService) {
        this.boutiqueService = boutiqueService;
    }

    private Long exiger(String userId) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return Long.valueOf(userId);
    }

    @GetMapping("/panier")
    public ResponseEntity<List<bj.myaddictive.boutique.dto.PanierItemResponse>> panier(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(boutiqueService.panier(exiger(userId)));
    }

    @PostMapping("/panier")
    public ResponseEntity<PanierItem> ajouter(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody AjouterPanierRequest requete) {
        return ResponseEntity.ok(boutiqueService.ajouterAuPanier(exiger(userId), requete));
    }

    @DeleteMapping("/panier/{id}")
    public ResponseEntity<Void> retirer(@RequestHeader(value = "X-User-Id", required = false) String userId, @PathVariable Long id) {
        boutiqueService.retirerDuPanier(exiger(userId), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/panier/{id}")
    public ResponseEntity<PanierItem> modifierQuantite(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long id, @RequestBody Map<String, Integer> corps) {
        int quantite = corps.getOrDefault("quantite", 1);
        return ResponseEntity.ok(boutiqueService.modifierQuantitePanier(exiger(userId), id, quantite));
    }

    @PostMapping("/commandes/initier")
    public ResponseEntity<Map<String, Object>> initierCommande(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody InitierCommandeRequest requete) {
        if (userId == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Connexion requise.");
        return ResponseEntity.ok(boutiqueService.initierCommande(userId, requete));
    }

    @GetMapping("/commandes")
    public ResponseEntity<List<Commande>> mesCommandes(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(boutiqueService.mesCommandes(exiger(userId)));
    }

    @GetMapping("/commandes/{id}/lignes")
    public ResponseEntity<List<LigneCommande>> lignes(@PathVariable Long id) {
        return ResponseEntity.ok(boutiqueService.lignesDeCommande(id));
    }

    /** Vue d'ensemble de toutes les commandes, tous acheteurs confondus, reservee aux administrateurs (gestion de la logistique). */
    @GetMapping("/commandes/admin")
    public ResponseEntity<List<Commande>> toutesLesCommandes(@RequestHeader(value = "X-User-Role", required = false) String role) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(boutiqueService.toutesLesCommandes());
    }

    /** Mise a jour du statut de livraison d'une ligne de commande precise (section 8.1), reservee aux administrateurs. */
    @PutMapping("/commandes/lignes/{ligneId}/statut-livraison")
    public ResponseEntity<LigneCommande> modifierStatutLivraison(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long ligneId, @RequestBody Map<String, String> corps) {
        exigerAdministrateur(role);
        return ResponseEntity.ok(boutiqueService.modifierStatutLivraison(ligneId, corps.get("statutLivraison")));
    }

    private void exigerAdministrateur(String role) {
        if (!"ADMINISTRATEUR".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Reserve aux administrateurs.");
        }
    }
}
