package bj.myaddictive.boutique.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "panier_item", uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "produit_id", "taille"}))
public class PanierItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "produit_id", nullable = false)
    private Long produitId;

    @Column(nullable = false)
    private Integer quantite;

    // Vide pour un produit sans taille (non vestimentaire). Fait partie de
    // la cle d'unicite : la meme reference en tailles differentes (ex. M et
    // L) doit pouvoir coexister comme deux lignes distinctes du panier.
    @Column(length = 10)
    private String taille;

    public String getTaille() { return taille; }
    public void setTaille(String taille) { this.taille = taille; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getProduitId() { return produitId; }
    public void setProduitId(Long produitId) { this.produitId = produitId; }
    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer quantite) { this.quantite = quantite; }
}
