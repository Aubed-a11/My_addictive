package bj.myaddictive.boutique.dto;

import bj.myaddictive.boutique.domain.PanierItem;
import bj.myaddictive.boutique.domain.Produit;

/** Ligne de panier enrichie des informations produit (nom, image, prix), pour eviter des appels N+1 cote app mobile. */
public record PanierItemResponse(
        Long id, Long produitId, Integer quantite,
        String nomProduit, String imageUrlProduit, Long prixFcfaProduit
) {
    public static PanierItemResponse fromEntities(PanierItem item, Produit produit) {
        return new PanierItemResponse(
                item.getId(), item.getProduitId(), item.getQuantite(),
                produit != null ? produit.getNom() : "Produit indisponible",
                produit != null ? produit.getImageUrl() : null,
                produit != null ? produit.getPrixFcfa() : 0L
        );
    }
}
