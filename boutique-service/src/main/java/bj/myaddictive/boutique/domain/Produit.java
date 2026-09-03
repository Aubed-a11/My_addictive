package bj.myaddictive.boutique.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "produit")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vendeur_id", nullable = false)
    private Long vendeurId;

    @Column(nullable = false)
    private String nom;

    @Column
    private String description;

    @Column(nullable = false, length = 30)
    private String categorie;

    @Column(name = "prix_fcfa", nullable = false)
    private Long prixFcfa;

    @Column(nullable = false)
    private Integer stock = 0;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "drop_limite", nullable = false)
    private boolean dropLimite = false;

    @Column(name = "date_debut_drop")
    private java.time.Instant dateDebutDrop;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVendeurId() { return vendeurId; }
    public void setVendeurId(Long vendeurId) { this.vendeurId = vendeurId; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    public Long getPrixFcfa() { return prixFcfa; }
    public void setPrixFcfa(Long prixFcfa) { this.prixFcfa = prixFcfa; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public boolean isDropLimite() { return dropLimite; }
    public void setDropLimite(boolean dropLimite) { this.dropLimite = dropLimite; }
    public java.time.Instant getDateDebutDrop() { return dateDebutDrop; }
    public void setDateDebutDrop(java.time.Instant dateDebutDrop) { this.dateDebutDrop = dateDebutDrop; }
}
