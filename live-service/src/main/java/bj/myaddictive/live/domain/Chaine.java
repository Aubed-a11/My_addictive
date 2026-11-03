package bj.myaddictive.live.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "chaine")
public class Chaine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(name = "proprietaire_utilisateur_id", nullable = false)
    private Long proprietaireUtilisateurId;

    @Column(name = "image_url")
    private String imageUrl;

    private String description;

    @Column(name = "nombre_abonnes", nullable = false)
    private Long nombreAbonnes = 0L;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public Long getProprietaireUtilisateurId() { return proprietaireUtilisateurId; }
    public void setProprietaireUtilisateurId(Long proprietaireUtilisateurId) { this.proprietaireUtilisateurId = proprietaireUtilisateurId; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getNombreAbonnes() { return nombreAbonnes; }
    public void setNombreAbonnes(Long nombreAbonnes) { this.nombreAbonnes = nombreAbonnes; }
}
