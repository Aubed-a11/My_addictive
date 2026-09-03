package bj.myaddictive.media.domain;

import jakarta.persistence.*;

/** Grille tarifaire de promotion pour les artistes (section 4.1) : Base, A1, A2, A3. */
@Entity
@Table(name = "offre_promotion")
public class OffrePromotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String code; // BASE, A1, A2, A3

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String description;

    @Column(name = "prix_fcfa", nullable = false)
    private Long prixFcfa;

    @Column(name = "duree_jours", nullable = false)
    private Integer dureeJours;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getPrixFcfa() { return prixFcfa; }
    public void setPrixFcfa(Long prixFcfa) { this.prixFcfa = prixFcfa; }
    public Integer getDureeJours() { return dureeJours; }
    public void setDureeJours(Integer dureeJours) { this.dureeJours = dureeJours; }
}
