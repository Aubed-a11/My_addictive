package bj.myaddictive.boutique.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "vendeur")
public class Vendeur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false, unique = true)
    private Long utilisateurId;

    @Column(name = "nom_boutique", nullable = false)
    private String nomBoutique;

    @Column(name = "image_url")
    private String imageUrl;

    @Column
    private String description;

    @Column(nullable = false, length = 30)
    private String categorie; // MODE, HIGH_TECH, MAISON, BEAUTE, ALIMENTATION, ARTISANAT, MUSIQUE, AUTRE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private StatutVendeur statut = StatutVendeur.EN_ATTENTE;

    @Column(name = "date_demande", nullable = false)
    private Instant dateDemande = Instant.now();

    @Column(name = "note_moyenne")
    private Double noteMoyenne = 0.0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public String getNomBoutique() { return nomBoutique; }
    public void setNomBoutique(String nomBoutique) { this.nomBoutique = nomBoutique; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    public StatutVendeur getStatut() { return statut; }
    public void setStatut(StatutVendeur statut) { this.statut = statut; }
    public Instant getDateDemande() { return dateDemande; }
    public void setDateDemande(Instant dateDemande) { this.dateDemande = dateDemande; }
    public Double getNoteMoyenne() { return noteMoyenne; }
    public void setNoteMoyenne(Double noteMoyenne) { this.noteMoyenne = noteMoyenne; }
}
