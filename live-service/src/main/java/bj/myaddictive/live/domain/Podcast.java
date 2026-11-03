package bj.myaddictive.live.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "podcast")
public class Podcast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String description;

    @Column(name = "editeur")
    private String editeur;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "chaine_id")
    private Long chaineId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getEditeur() { return editeur; }
    public void setEditeur(String editeur) { this.editeur = editeur; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Long getChaineId() { return chaineId; }
    public void setChaineId(Long chaineId) { this.chaineId = chaineId; }
}
