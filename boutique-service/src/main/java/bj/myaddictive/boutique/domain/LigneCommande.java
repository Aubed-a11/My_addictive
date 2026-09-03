package bj.myaddictive.boutique.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "ligne_commande")
public class LigneCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "commande_id", nullable = false)
    private Long commandeId;

    @Column(name = "vendeur_id", nullable = false)
    private Long vendeurId;

    @Column(name = "produit_id", nullable = false)
    private Long produitId;

    @Column(name = "nom_produit", nullable = false)
    private String nomProduit;

    @Column(nullable = false)
    private Integer quantite;

    @Column(name = "prix_unitaire_fcfa", nullable = false)
    private Long prixUnitaireFcfa;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_livraison", nullable = false, length = 15)
    private StatutLivraison statutLivraison = StatutLivraison.EN_PREPARATION;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCommandeId() { return commandeId; }
    public void setCommandeId(Long commandeId) { this.commandeId = commandeId; }
    public Long getVendeurId() { return vendeurId; }
    public void setVendeurId(Long vendeurId) { this.vendeurId = vendeurId; }
    public Long getProduitId() { return produitId; }
    public void setProduitId(Long produitId) { this.produitId = produitId; }
    public String getNomProduit() { return nomProduit; }
    public void setNomProduit(String nomProduit) { this.nomProduit = nomProduit; }
    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer quantite) { this.quantite = quantite; }
    public Long getPrixUnitaireFcfa() { return prixUnitaireFcfa; }
    public void setPrixUnitaireFcfa(Long prixUnitaireFcfa) { this.prixUnitaireFcfa = prixUnitaireFcfa; }
    public StatutLivraison getStatutLivraison() { return statutLivraison; }
    public void setStatutLivraison(StatutLivraison statutLivraison) { this.statutLivraison = statutLivraison; }
}
